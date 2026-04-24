"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { Film, Upload, X, CheckCircle2 } from "lucide-react"
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

type Props = {
  motivo: string
  marcadoresSugeridos: Marcador[]
  onSubmit: (result: {
    video_uri: string
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
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File | null) {
    if (!f) return
    if (!f.type.startsWith("video/")) return
    setFile(f)
  }

  function toggleMarker(m: Marcador) {
    setSelected((s) =>
      s.includes(m) ? s.filter((x) => x !== m) : [...s, m],
    )
  }

  function submit() {
    if (!file || selected.length === 0) return
    // Simulated URI — in production we'd upload to storage
    const video_uri = `mira://video/${encodeURIComponent(file.name)}#${file.size}`
    onSubmit({ video_uri, marcadores: selected, cancelado: false })
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
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFile(e.dataTransfer.files?.[0] ?? null)
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/40 hover:bg-muted/70",
            disabled && "pointer-events-none opacity-60",
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
              className="flex items-center gap-3"
            >
              <CheckCircle2 className="size-6 text-[color:var(--risk-low)]" />
              <div className="text-left">
                <p className="text-sm font-medium">{file.name}</p>
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
                  setFile(null)
                  if (inputRef.current) inputRef.current.value = ""
                }}
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
                MP4, MOV · hasta 2 minutos recomendado
              </p>
            </>
          )}
        </div>

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
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
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
                onSubmit({ video_uri: "", marcadores: [], cancelado: true })
              }
              disabled={disabled}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={submit}
              disabled={!file || selected.length === 0 || disabled}
            >
              Enviar para análisis
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
