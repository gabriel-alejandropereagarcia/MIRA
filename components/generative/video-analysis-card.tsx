"use client"

import { motion } from "framer-motion"
import { Eye, Ear, Hand, AlertTriangle, FileVideo } from "lucide-react"
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
  presencia: "presente" | "ausente" | "inconsistente" | string
  confianza: number
}

type Props = {
  videoUri: string
  duracionSeg: number
  resultados: Resultado[]
  alertaClinica: boolean
  nota: string
}

const META: Record<Marcador, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  contacto_visual: { label: "Contacto visual", icon: Eye },
  respuesta_nombre: { label: "Respuesta al nombre", icon: Ear },
  aleteo_manos: { label: "Aleteo de manos", icon: Hand },
  senalamiento: { label: "Señalamiento", icon: Hand },
}

function toneForPresence(p: string) {
  switch (p) {
    case "presente":
      return "text-[color:var(--risk-low)] bg-[color:var(--risk-low)]/12"
    case "inconsistente":
      return "text-[color:var(--risk-medium)] bg-[color:var(--risk-medium)]/15"
    case "ausente":
      return "text-[color:var(--risk-high)] bg-[color:var(--risk-high)]/12"
    default:
      return "text-muted-foreground bg-muted"
  }
}

export function VideoAnalysisCard({
  videoUri,
  duracionSeg,
  resultados,
  alertaClinica,
  nota,
}: Props) {
  const fileName = decodeURIComponent(
    videoUri.split("/").pop()?.split("#")[0] ?? "video",
  )

  return (
    <Card className="w-full max-w-xl border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileVideo className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base font-semibold">
                Análisis de video
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {fileName} · {duracionSeg}s analizados
              </p>
            </div>
          </div>
          {alertaClinica && (
            <Badge className="gap-1 border-0 bg-[color:var(--risk-high)]/15 text-[color:var(--risk-high)]">
              <AlertTriangle className="size-3" />
              Alerta
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {resultados.map((r, i) => {
            const meta = META[r.marcador as Marcador] ?? {
              label: r.marcador,
              icon: Eye,
            }
            const Icon = meta.icon
            return (
              <motion.li
                key={r.marcador}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{meta.label}</p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(r.confianza * 100)}%` }}
                      transition={{ duration: 0.7 }}
                      className="h-full rounded-full bg-primary/70"
                    />
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                    toneForPresence(r.presencia),
                  )}
                >
                  {r.presencia}
                </span>
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
