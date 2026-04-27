"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, Film, Loader2, Upload, X } from "lucide-react"
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

export function VideoUploader({
  motivo,
  marcadoresSugeridos,
  onSubmit,
  disabled,
}: Props) {
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

    // Optimistic UI: switch to "uploading" immediately. We move to
    // "processing" once the request is in-flight, since the server
    // polls Gemini's File API state internally.
    setPhase("uploading")

    const formData = new FormData()
    formData.append("video", file)

    try {
      // Move into the processing phase as soon as the request is sent —
      // the user sees a clear two-step progression even though both
      // happen inside the same fetch() call from their perspective.
      const inflight = fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      })
      // Switch label after a brief delay so the "uploading" state is
      // visible even on fast networks.
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
                MP4, MOV · máx 50 MB · 2 minutos recomendado
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
              onClick={() =>
                onSubmit({
                  video_uri: "",
                  mime_type: "",
                  marcadores: [],
                  cancelado: true,
                })
              }
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
