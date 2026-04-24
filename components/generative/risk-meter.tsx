"use client"

import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, Info, Stethoscope } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Riesgo = "bajo" | "medio" | "alto"

type Props = {
  score: number
  riesgo: Riesgo
  itemsEnRiesgo: number[]
  edadMeses: number
  recomendacion: string
}

const LEVEL_META: Record<
  Riesgo,
  {
    label: string
    tone: string
    ring: string
    bg: string
    text: string
    icon: React.ComponentType<{ className?: string }>
    range: string
  }
> = {
  bajo: {
    label: "Riesgo Bajo",
    tone: "Tu observación sugiere un desarrollo en rango esperado.",
    ring: "ring-[color:var(--risk-low)]/40",
    bg: "bg-[color:var(--risk-low)]/15",
    text: "text-[color:var(--risk-low)]",
    icon: CheckCircle2,
    range: "0–2 puntos",
  },
  medio: {
    label: "Riesgo Medio",
    tone: "Se recomienda seguimiento. No es un diagnóstico.",
    ring: "ring-[color:var(--risk-medium)]/40",
    bg: "bg-[color:var(--risk-medium)]/15",
    text: "text-[color:var(--risk-medium)]",
    icon: Info,
    range: "3–7 puntos",
  },
  alto: {
    label: "Riesgo Alto",
    tone: "Se sugiere evaluación diagnóstica profesional.",
    ring: "ring-[color:var(--risk-high)]/40",
    bg: "bg-[color:var(--risk-high)]/15",
    text: "text-[color:var(--risk-high)]",
    icon: AlertTriangle,
    range: "8–20 puntos",
  },
}

export function RiskMeter({
  score,
  riesgo,
  itemsEnRiesgo,
  edadMeses,
  recomendacion,
}: Props) {
  const meta = LEVEL_META[riesgo]
  const Icon = meta.icon
  // Percent fill: 0-20 → 0-100%
  const fillPct = Math.min(100, Math.max(0, (score / 20) * 100))

  return (
    <Card
      className={cn(
        "w-full max-w-xl border-border/60 shadow-sm ring-1",
        meta.ring,
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full",
                meta.bg,
                meta.text,
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-base font-semibold">
                Resultado M-CHAT-R/F
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Edad evaluada: {edadMeses} meses · {meta.range}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={cn("font-medium", meta.bg, meta.text, "border-0")}
          >
            {meta.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Thermometer track */}
        <div
          role="meter"
          aria-valuemin={0}
          aria-valuemax={20}
          aria-valuenow={score}
          aria-label={`Puntuación M-CHAT: ${score} de 20`}
          className="relative"
        >
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "h-full rounded-full",
                riesgo === "bajo" && "bg-[color:var(--risk-low)]",
                riesgo === "medio" && "bg-[color:var(--risk-medium)]",
                riesgo === "alto" && "bg-[color:var(--risk-high)]",
              )}
            />
          </div>
          {/* Zone separators */}
          <div className="pointer-events-none absolute inset-0 flex">
            <div className="w-[15%] border-r border-background/70" />
            <div className="w-[25%] border-r border-background/70" />
            <div className="flex-1" />
          </div>
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>Bajo</span>
            <span className="ml-[6%]">Medio</span>
            <span>Alto</span>
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <motion.span
            key={score}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("font-serif text-4xl font-semibold", meta.text)}
          >
            {score}
          </motion.span>
          <span className="text-sm text-muted-foreground">/ 20 puntos</span>
          {itemsEnRiesgo.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">
              Ítems marcados: {itemsEnRiesgo.join(", ")}
            </span>
          )}
        </div>

        <p className="text-sm text-foreground/90">{meta.tone}</p>

        <div className="flex items-start gap-2 rounded-lg bg-secondary/60 p-3 text-sm text-secondary-foreground">
          <Stethoscope className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>{recomendacion}</p>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          MIRA es una herramienta de <strong>cribado</strong>, no de diagnóstico.
          Cualquier confirmación corresponde a un profesional calificado.
        </p>
      </CardContent>
    </Card>
  )
}
