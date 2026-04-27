"use client"

import { motion } from "framer-motion"
import {
  AlertTriangle,
  Ear,
  Eye,
  FileVideo,
  Hand,
  HelpCircle,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Marcador =
  | "contacto_visual"
  | "respuesta_nombre"
  | "aleteo_manos"
  | "senalamiento"

type Resultado = {
  marcador: string
  presencia: "presente" | "ausente" | "inconsistente" | "no_evaluable" | string
  confianza: number
  observacion?: string
}

type Calidad = "buena" | "aceptable" | "baja" | string

type Props = {
  videoUri: string
  duracionSeg: number
  resultados: Resultado[]
  alertaClinica: boolean
  calidadVideo?: Calidad
  nota: string
}

const META: Record<
  Marcador,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  contacto_visual: { label: "Contacto visual", icon: Eye },
  respuesta_nombre: { label: "Respuesta al nombre", icon: Ear },
  aleteo_manos: { label: "Aleteo de manos", icon: Hand },
  senalamiento: { label: "Señalamiento", icon: Hand },
}

function presenciaTone(p: string) {
  switch (p) {
    case "presente":
      return "text-[color:var(--risk-low)] bg-[color:var(--risk-low)]/12"
    case "inconsistente":
      return "text-[color:var(--risk-medium)] bg-[color:var(--risk-medium)]/15"
    case "ausente":
      return "text-[color:var(--risk-high)] bg-[color:var(--risk-high)]/12"
    case "no_evaluable":
      return "text-muted-foreground bg-muted"
    default:
      return "text-muted-foreground bg-muted"
  }
}

function presenciaLabel(p: string) {
  if (p === "no_evaluable") return "no evaluable"
  return p
}

function qualityTone(q: Calidad) {
  if (q === "buena") return "border-[color:var(--risk-low)]/40 bg-[color:var(--risk-low)]/10 text-[color:var(--risk-low)]"
  if (q === "baja") return "border-[color:var(--risk-high)]/40 bg-[color:var(--risk-high)]/10 text-[color:var(--risk-high)]"
  return "border-[color:var(--risk-medium)]/40 bg-[color:var(--risk-medium)]/10 text-[color:var(--risk-medium)]"
}

function qualityLabel(q: Calidad) {
  if (q === "buena") return "Calidad buena"
  if (q === "baja") return "Calidad baja"
  if (q === "aceptable") return "Calidad aceptable"
  return `Calidad ${q}`
}

/**
 * Strip the optional `mira://video/<name>#<size>` legacy hash and the
 * Gemini File API path, leaving something readable for the user. The
 * full URI is opaque and not useful in the UI.
 */
function displayVideoLabel(uri: string) {
  if (uri.startsWith("mira://video/")) {
    return decodeURIComponent(uri.split("/").pop()?.split("#")[0] ?? "video")
  }
  if (uri.includes("generativelanguage.googleapis.com")) {
    return "Video procesado por Gemini File API"
  }
  return uri.slice(0, 64)
}

export function VideoAnalysisCard({
  videoUri,
  duracionSeg,
  resultados,
  alertaClinica,
  calidadVideo,
  nota,
}: Props) {
  return (
    <Card className="w-full max-w-xl border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileVideo className="size-5" />
            </span>
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold">
                Análisis de video
              </CardTitle>
              <p className="truncate text-xs text-muted-foreground">
                {displayVideoLabel(videoUri)}
                {duracionSeg > 0 && ` · ${duracionSeg}s analizados`}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Badge className="gap-1 border-0 bg-primary/15 text-primary">
              <Sparkles className="size-3" />
              Análisis por IA
            </Badge>
            {alertaClinica && (
              <Badge className="gap-1 border-0 bg-[color:var(--risk-high)]/15 text-[color:var(--risk-high)]">
                <AlertTriangle className="size-3" />
                Alerta
              </Badge>
            )}
          </div>
        </div>
        {calidadVideo && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                qualityTone(calidadVideo),
              )}
            >
              {qualityLabel(calidadVideo)}
            </span>
            {calidadVideo === "baja" && (
              <span className="text-[11px] text-muted-foreground">
                Algunos marcadores pueden quedar como “no evaluables”.
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {resultados.map((r, i) => {
            const meta = META[r.marcador as Marcador] ?? {
              label: r.marcador,
              icon: HelpCircle,
            }
            const Icon = meta.icon
            const isUnevaluable = r.presencia === "no_evaluable"
            return (
              <motion.li
                key={r.marcador}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-lg border border-border/60 p-3"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{meta.label}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                          presenciaTone(r.presencia),
                        )}
                      >
                        {presenciaLabel(r.presencia)}
                      </span>
                    </div>
                    {!isUnevaluable && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.round(r.confianza * 100)}%`,
                          }}
                          transition={{ duration: 0.7 }}
                          className="h-full rounded-full bg-primary/70"
                        />
                      </div>
                    )}
                    {r.observacion && (
                      <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                        {r.observacion}
                      </p>
                    )}
                  </div>
                </div>
              </motion.li>
            )
          })}
        </ul>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {nota}
        </p>
      </CardContent>
    </Card>
  )
}
