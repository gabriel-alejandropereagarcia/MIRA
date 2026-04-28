"use client"

/**
 * MIRA — Report download surface.
 *
 * Two public exports:
 *  - <DownloadReportButton />  Manual download button shown after a result.
 *  - <AutoDownloadReport />    Headless component used when MIRA proactively
 *                              calls the `generar_informe_pediatra` tool;
 *                              it triggers exactly one download on mount and
 *                              reports completion back through the tool API.
 *
 * Both lazy-load `@react-pdf/renderer` and the document tree at click time
 * (or mount time) so the heavy PDF runtime never ships in the initial
 * bundle and never SSRs.
 */

import { useEffect, useRef, useState } from "react"
import { Download, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ReportData } from "@/components/mira/report-document"

/**
 * Map the clinical signals already living in `ReportData` to the
 * four-bucket risk taxonomy consumed by the durable follow-up workflow.
 *
 *  - ALTO        → M-CHAT alto, OR M-CHAT medio + Follow-Up positivo.
 *  - MEDIO       → M-CHAT medio (Follow-Up negativo or absent).
 *  - BAJO_DUDAS  → M-CHAT bajo BUT caregiver reported concerns or there
 *                  are unchecked CDC red-flag milestones (the same
 *                  triangulation rule MIRA enforces in the chat).
 *  - BAJO        → M-CHAT bajo, no concerns, no pending red flags.
 */
type DurableRiskLevel = "ALTO" | "MEDIO" | "BAJO_DUDAS" | "BAJO"

function deriveDurableRiskLevel(data: ReportData): DurableRiskLevel {
  const riesgo = data.mchat.riesgo
  const followUpPositive = data.followUp?.resultado === "positivo"

  if (riesgo === "alto" || (riesgo === "medio" && followUpPositive)) {
    return "ALTO"
  }
  if (riesgo === "medio") {
    return "MEDIO"
  }
  // riesgo === "bajo": triangulate before discharging.
  const hasConcerns = data.child.concerns.length > 0
  const hasPendingRedFlags =
    (data.developmentalContext?.redFlagMilestonesUnchecked.length ?? 0) > 0
  return hasConcerns || hasPendingRedFlags ? "BAJO_DUDAS" : "BAJO"
}

/**
 * Fire-and-forget helper that schedules the durable follow-up. Errors
 * are swallowed by design — the workflow trigger is best-effort and
 * must NEVER interrupt the caregiver's PDF download experience.
 */
async function scheduleDurableFollowUp(data: ReportData): Promise<void> {
  try {
    const riskLevel = deriveDurableRiskLevel(data)
    const res = await fetch("/api/workflows/followup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "", // not collected in this MVP; workflow handles empty
        childName: data.child.alias ?? "",
        riskLevel,
      }),
    })
    if (!res.ok) {
      console.log(
        "[v0] follow-up workflow trigger non-2xx:",
        res.status,
      )
      return
    }
    const json = (await res.json()) as { runId?: string }
    if (json.runId) {
      console.log(
        "[v0] Durable follow-up scheduled runId=%s riskLevel=%s",
        json.runId,
        riskLevel,
      )
    }
  } catch (err) {
    console.log(
      "[v0] Failed to schedule durable follow-up:",
      (err as Error).message,
    )
  }
}

/* ------------------------------------------------------------------------ */
/*  Shared download routine                                                 */
/* ------------------------------------------------------------------------ */

async function generateAndDownload(data: ReportData): Promise<void> {
  // Lazy-load both the runtime and the document tree on demand.
  const [{ pdf }, { MiraReportDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/mira/report-document"),
  ])

  const blob = await pdf(<MiraReportDocument data={data} />).toBlob()

  const safeAlias = (data.child.alias || "nino")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  const stamp = new Date().toISOString().slice(0, 10)
  const filename = `informe-mira-${safeAlias}-${stamp}.pdf`

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Give the browser one tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ------------------------------------------------------------------------ */
/*  Manual button                                                           */
/* ------------------------------------------------------------------------ */

type ButtonProps = {
  data: ReportData
  className?: string
}

export function DownloadReportButton({ data, className }: ButtonProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onClick() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await generateAndDownload(data)
      // Fire-and-forget: launch the durable follow-up workflow once
      // the caregiver actually has the PDF in hand. Awaiting on a
      // detached promise is intentional — failures are logged but
      // never bubble up to the UI.
      void scheduleDurableFollowUp(data)
    } catch (err) {
      console.log("[v0] PDF generation failed:", (err as Error).message)
      setError("No se pudo generar el PDF. Intenta nuevamente.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={className}>
      <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <FileText className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Informe profesional para tu pediatra
          </p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
            Descarga un PDF con el resultado completo, los ítems marcados y la
            recomendación clínica. Llévalo impreso o digital a la consulta.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="default"
              onClick={onClick}
              disabled={busy}
              className="gap-2"
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generando…
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  Descargar informe para tu pediatra
                </>
              )}
            </Button>
            {error && (
              <span
                role="alert"
                className="text-[11.5px] font-medium text-destructive"
              >
                {error}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/*  Auto-download (proactive tool path)                                     */
/* ------------------------------------------------------------------------ */

type AutoProps = {
  data: ReportData | null
  motivo: string
  onComplete: (output: { generado: boolean }) => void
}

/**
 * Renders inline acknowledgement when MIRA itself fires the tool. It
 * triggers download exactly once on mount (guarded by a ref) and reports
 * back through `onComplete`. If `data` is null — i.e. the AI invoked the
 * tool before we have a result — it reports `generado: false` instead of
 * silently failing, so the model can react.
 */
export function AutoDownloadReport({ data, motivo, onComplete }: AutoProps) {
  const fired = useRef(false)
  const [phase, setPhase] = useState<"running" | "done" | "error" | "skipped">(
    "running",
  )

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    if (!data) {
      setPhase("skipped")
      onComplete({ generado: false })
      return
    }

    let cancelled = false
    void (async () => {
      try {
        await generateAndDownload(data)
        if (cancelled) return
        setPhase("done")
        onComplete({ generado: true })
        // Schedule the durable re-evaluation reminder. Best-effort,
        // never blocks UI feedback to the caregiver.
        void scheduleDurableFollowUp(data)
      } catch (err) {
        if (cancelled) return
        console.log("[v0] auto PDF generation failed:", (err as Error).message)
        setPhase("error")
        onComplete({ generado: false })
      }
    })()

    return () => {
      cancelled = true
    }
    // We intentionally only run this on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        {phase === "running" ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <FileText className="size-5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          {phase === "running"
            ? "Generando informe para tu pediatra…"
            : phase === "done"
              ? "Informe descargado"
              : phase === "skipped"
                ? "Aún no hay datos suficientes"
                : "No se pudo generar el informe"}
        </p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
          {phase === "running"
            ? motivo
            : phase === "done"
              ? "Revisa tu carpeta de descargas. El archivo se llama informe-mira-…pdf."
              : phase === "skipped"
                ? "Necesitamos completar al menos el cuestionario M-CHAT antes de generar el informe."
                : "Vuelve a intentarlo en unos segundos o usa el botón de descarga manual."}
        </p>
      </div>
    </div>
  )
}
