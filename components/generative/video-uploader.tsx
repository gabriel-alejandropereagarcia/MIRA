"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Film,
  Languages,
  Lightbulb,
  Loader2,
  ShieldCheck,
  Smile,
  Upload,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Marcador =
  | "contacto_visual"
  | "respuesta_nombre"
  | "aleteo_manos"
  | "senalamiento"

const MARCADOR_LABEL: Record<Marcador, string> = {
  contacto_visual: "Contacto visual",
  respuesta_nombre: "Respuesta al nombre",
  aleteo_manos: "Aleteo de manos",
  senalamiento: "Señalamiento",
}

/** UI phases for the upload pipeline. */
type Phase = "idle" | "uploading" | "processing" | "ready" | "error"

const MAX_BYTES = 50 * 1024 * 1024
const RECOMMENDED_MIN_SECONDS = 30
const RECOMMENDED_MAX_SECONDS = 60

type Props = {
  motivo: string
  marcadoresSugeridos: Marcador[]
  onSubmit: (result: {
    video_uri: string
    mime_type: string
    marcadores: Marcador[]
    cancelado: boolean
  }) => void
  disabled?: boolean
}

/**
 * Two-step upload UX.
 *
 * Step 1 (`stage === "guide"`) — a calm pre-recording briefing that
 * spells out exactly WHAT to record, HOW long, and WHAT NOT to record.
 * The caregiver must explicitly acknowledge the privacy + consent
 * checklist before they can move on. This is critical for the video to
 * be useful as an "objective referee" in the triangulation flow: a
 * well-framed clip of natural play yields signal; a directed,
 * over-rehearsed clip yields noise.
 *
 * Step 2 (`stage === "upload"`) — the actual file picker, marker
 * selection, and submit. Identical to the previous version's flow.
 */
type Stage = "guide" | "upload"

export function VideoUploader({
  motivo,
  marcadoresSugeridos,
  onSubmit,
  disabled,
}: Props) {
  const [stage, setStage] = useState<Stage>("guide")
  const [acknowledged, setAcknowledged] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selected, setSelected] = useState<Marcador[]>(marcadoresSugeridos)
  const [phase, setPhase] = useState<Phase>("idle")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isBusy = phase === "uploading" || phase === "processing"
  const lockUI = isBusy || disabled

  function handleFile(f: File | null) {
    if (!f) return
    if (!f.type.startsWith("video/")) {
      setError("El archivo seleccionado no es un video.")
      return
    }
    if (f.size > MAX_BYTES) {
      setError("Ese video supera los 50 MB. Recorta o comprime e intenta de nuevo.")
      return
    }
    setError(null)
    setFile(f)
  }

  function toggleMarker(m: Marcador) {
    if (lockUI) return
    setSelected((s) =>
      s.includes(m) ? s.filter((x) => x !== m) : [...s, m],
    )
  }

  function reset() {
    if (lockUI) return
    setFile(null)
    setError(null)
    setPhase("idle")
    if (inputRef.current) inputRef.current.value = ""
  }

  async function submit() {
    if (!file || selected.length === 0 || isBusy) return
    setError(null)
    setPhase("uploading")

    const formData = new FormData()
    formData.append("video", file)

    try {
      const inflight = fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      })
      const phaseTimer = setTimeout(() => setPhase("processing"), 600)
      const res = await inflight
      clearTimeout(phaseTimer)

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(body?.error || "No se pudo procesar el video.")
      }

      const data = (await res.json()) as {
        fileUri: string
        mimeType: string
        name: string
      }

      setPhase("ready")
      onSubmit({
        video_uri: data.fileUri,
        mime_type: data.mimeType,
        marcadores: selected,
        cancelado: false,
      })
    } catch (err) {
      console.log("[v0] video upload failed:", (err as Error).message)
      setPhase("error")
      setError(
        (err as Error).message ||
          "No se pudo subir el video. Revisa tu conexión e intenta de nuevo.",
      )
    }
  }

  function cancelAll() {
    onSubmit({
      video_uri: "",
      mime_type: "",
      marcadores: [],
      cancelado: true,
    })
  }

  /* ---------------- Step 1 — Guide ---------------- */
  if (stage === "guide") {
    return (
      <Card className="w-full max-w-xl border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Film className="size-5" />
            </span>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold">
                Cómo grabar el video
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">{motivo}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[13px] leading-relaxed text-foreground/85">
            Para que el análisis sea útil necesitamos que el video capture al
            niño/a en una situación natural. Cuanto menos pongamos en escena,
            más confiable será el resultado.
          </p>

          <section className="space-y-2.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              Qué grabar
            </h3>
            <GuideRow
              icon={<Smile className="size-4" />}
              title="Juego libre con un familiar"
              body="El niño/a jugando con sus juguetes habituales mientras un familiar interactúa de forma natural. No le pidas que mire a la cámara ni que haga algo específico."
            />
            <GuideRow
              icon={<Languages className="size-4" />}
              title="Llámalo por su nombre 1–2 veces"
              body="Mientras juega, llámalo por su nombre con voz normal y deja unos segundos sin insistir. Esto nos permite evaluar la respuesta al nombre."
            />
            <GuideRow
              icon={<Eye className="size-4" />}
              title="Algún momento de interacción cara a cara"
              body="Mostrarle un objeto interesante, pedirle algo simple o hacerlo reír. No fuerces el contacto visual; queremos ver cómo lo busca espontáneamente."
            />
          </section>

          <section className="space-y-2.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              Cómo grabarlo
            </h3>
            <GuideRow
              icon={<Clock className="size-4" />}
              title={`Duración: ${RECOMMENDED_MIN_SECONDS}–${RECOMMENDED_MAX_SECONDS} segundos`}
              body="Con un minuto suele bastar. Si grabas más de 90 segundos el análisis pierde foco."
            />
            <GuideRow
              icon={<Lightbulb className="size-4" />}
              title="Buena luz y cámara estable"
              body="Luz natural si es posible, niño/a centrado en el cuadro. Evita contraluz y movimientos bruscos de cámara — apoya el teléfono o usa modo horizontal."
            />
            <GuideRow
              icon={<ShieldCheck className="size-4" />}
              title="Sin baño, ni cambio de pañal, ni desnudez"
              body="Por respeto al niño/a y por privacidad, evita esas situaciones. Si sales en la grabación, asegúrate de que estás cómodo/a con que un profesional lo vea."
            />
          </section>

          <div
            role="note"
            className="rounded-lg border border-amber-500/40 bg-amber-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
          >
            <p className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="size-3.5" />
              Importante
            </p>
            <p className="mt-1">
              El video se sube de forma cifrada y se procesa solo para este
              análisis. <strong>No lo guardamos</strong> después de la sesión.
              Si grabas a otra persona, asegúrate de tener su consentimiento.
            </p>
          </div>

          <label
            htmlFor="video-consent"
            className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/70 bg-background px-3 py-2.5"
          >
            <input
              id="video-consent"
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 size-4 rounded border-border accent-primary"
            />
            <span className="text-[12.5px] leading-snug text-foreground/90">
              He leído las instrucciones y entiendo que el video se procesa de
              forma confidencial únicamente para este análisis.
            </span>
          </label>

          <div className="flex items-center justify-between gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={cancelAll}>
              Ahora no
            </Button>
            <Button
              type="button"
              onClick={() => setStage("upload")}
              disabled={!acknowledged}
            >
              Entendido — subir video
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  /* ---------------- Step 2 — Upload ---------------- */
  return (
    <Card className="w-full max-w-xl border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Film className="size-5" />
          </span>
          <div>
            <CardTitle className="text-base font-semibold">
              Subir video para análisis
            </CardTitle>
            <p className="text-xs text-muted-foreground">{motivo}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recap pill */}
        <button
          type="button"
          onClick={() => !lockUI && setStage("guide")}
          disabled={lockUI}
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-left text-[12px] text-muted-foreground transition-colors hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>
            <span className="font-medium text-foreground">
              {RECOMMENDED_MIN_SECONDS}–{RECOMMENDED_MAX_SECONDS} s
            </span>{" "}
            · juego libre · buena luz · sin redirigir
          </span>
          <span className="text-[11px] underline-offset-2 hover:underline">
            Ver instrucciones
          </span>
        </button>

        {/* Dropzone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Zona de carga de video"
          onClick={() => !lockUI && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (lockUI) return
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
          }}
          onDragOver={(e) => {
            if (lockUI) return
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            if (lockUI) return
            e.preventDefault()
            setDragOver(false)
            handleFile(e.dataTransfer.files?.[0] ?? null)
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/40 hover:bg-muted/70",
            lockUI && "pointer-events-none opacity-60",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex w-full items-center gap-3"
            >
              <CheckCircle2 className="size-6 shrink-0 text-[color:var(--risk-low)]" />
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB · video listo
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-2"
                onClick={(e) => {
                  e.stopPropagation()
                  reset()
                }}
                disabled={lockUI}
              >
                <X className="size-4" />
                <span className="sr-only">Quitar video</span>
              </Button>
            </motion.div>
          ) : (
            <>
              <Upload className="mb-2 size-6 text-muted-foreground" />
              <p className="text-sm font-medium">
                Arrastra un video o haz clic para subir
              </p>
              <p className="text-xs text-muted-foreground">
                MP4, MOV · máx 50 MB · {RECOMMENDED_MIN_SECONDS}–
                {RECOMMENDED_MAX_SECONDS} segundos recomendado
              </p>
            </>
          )}
        </div>

        {/* Status feedback (loading / error) */}
        {phase === "uploading" && (
          <StatusRow tone="info">
            <Loader2 className="size-4 animate-spin" />
            Subiendo video…
          </StatusRow>
        )}
        {phase === "processing" && (
          <StatusRow tone="info">
            <Loader2 className="size-4 animate-spin" />
            Procesando con Gemini…
          </StatusRow>
        )}
        {phase === "ready" && (
          <StatusRow tone="success">
            <CheckCircle2 className="size-4" />
            Listo. Iniciando análisis…
          </StatusRow>
        )}
        {phase === "error" && error && (
          <StatusRow tone="error">
            <AlertTriangle className="size-4" />
            {error}
          </StatusRow>
        )}

        {/* Marcadores */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Marcadores a analizar
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MARCADOR_LABEL) as Marcador[]).map((m) => {
              const active = selected.includes(m)
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMarker(m)}
                  disabled={lockUI}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                    lockUI && "cursor-not-allowed opacity-60 hover:bg-background",
                  )}
                  aria-pressed={active}
                >
                  {MARCADOR_LABEL[m]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Badge variant="outline" className="text-[11px]">
            Tus videos son confidenciales
          </Badge>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={cancelAll}
              disabled={lockUI}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={submit}
              disabled={!file || selected.length === 0 || lockUI}
            >
              {phase === "uploading"
                ? "Subiendo…"
                : phase === "processing"
                  ? "Procesando…"
                  : "Enviar para análisis"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* -------------------------------- helpers -------------------------------- */

function GuideRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium leading-snug text-foreground">
          {title}
        </p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
    </div>
  )
}

function StatusRow({
  tone,
  children,
}: {
  tone: "info" | "success" | "error"
  children: React.ReactNode
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
        tone === "info" &&
          "border-primary/30 bg-primary/5 text-primary",
        tone === "success" &&
          "border-[color:var(--risk-low)]/30 bg-[color:var(--risk-low)]/10 text-[color:var(--risk-low)]",
        tone === "error" &&
          "border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      {children}
    </div>
  )
}
