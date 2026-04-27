"use client"

import { motion } from "framer-motion"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Info,
  Stethoscope,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Riesgo = "bajo" | "medio" | "alto"

/* ----------------------------------------------------------- *
 *  Discriminated-union props: Stage 1 (default) vs Follow-Up. *
 * ----------------------------------------------------------- */

type MchatProps = {
  variant?: "mchat"
  score: number
  riesgo: Riesgo
  itemsEnRiesgo: number[]
  edadMeses: number
  recomendacion: string
}

type FollowupProps = {
  variant: "followup"
  scoreStage1: number
  followupScore: number
  totalItemsEvaluados: number
  resultadoFollowup: "positivo" | "negativo"
  itemsQueFallanFollowup: number[]
  edadMeses: number
  recomendacion: string
}

type Props = MchatProps | FollowupProps

const LEVEL_META: Record<
  Riesgo,
  {
    label: string
    tone: string
    ring: string
    bg: string
    text: string
    fill: string
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
    fill: "bg-[color:var(--risk-low)]",
    icon: CheckCircle2,
    range: "0–2 puntos",
  },
  medio: {
    label: "Riesgo Medio",
    tone: "Se recomienda seguimiento. No es un diagnóstico.",
    ring: "ring-[color:var(--risk-medium)]/40",
    bg: "bg-[color:var(--risk-medium)]/15",
    text: "text-[color:var(--risk-medium)]",
    fill: "bg-[color:var(--risk-medium)]",
    icon: Info,
    range: "3–7 puntos",
  },
  alto: {
    label: "Riesgo Alto",
    tone: "Se sugiere evaluación diagnóstica profesional.",
    ring: "ring-[color:var(--risk-high)]/40",
    bg: "bg-[color:var(--risk-high)]/15",
    text: "text-[color:var(--risk-high)]",
    fill: "bg-[color:var(--risk-high)]",
    icon: AlertTriangle,
    range: "8–20 puntos",
  },
}

export function RiskMeter(props: Props) {
  if (props.variant === "followup") {
    return <FollowupCard {...props} />
  }
  return <MchatCard {...props} />
}

/* ----------------------------------------------------------- *
 *  Variante Stage 1 (M-CHAT)                                  *
 * ----------------------------------------------------------- */

function MchatCard({
  score,
  riesgo,
  itemsEnRiesgo,
  edadMeses,
  recomendacion,
}: MchatProps) {
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
            className={cn("font-medium border-0", meta.bg, meta.text)}
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
              className={cn("h-full rounded-full", meta.fill)}
            />
          </div>
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

        <p className="border-t border-border/40 pt-3 text-[10px] leading-relaxed text-muted-foreground">
          M-CHAT-R/F™ © 2009 Diana L. Robins, Deborah Fein, &amp; Marianne Barton.
          Ref: mchatscreen.com
        </p>
      </CardContent>
    </Card>
  )
}

/* ----------------------------------------------------------- *
 *  Variante Stage 2 (Follow-Up)                               *
 *                                                             *
 *  Resultado binario (positivo/negativo) según ≥2 ítems       *
 *  fallados en el Follow-Up. Reusa el ritmo visual del Stage  *
 *  1 (badge + meter + recomendación) pero ajustando el max,   *
 *  el copy y el color.                                        *
 * ----------------------------------------------------------- */

function FollowupCard({
  scoreStage1,
  followupScore,
  totalItemsEvaluados,
  resultadoFollowup,
  itemsQueFallanFollowup,
  edadMeses,
  recomendacion,
}: FollowupProps) {
  const isPositive = resultadoFollowup === "positivo"
  const Icon = isPositive ? AlertTriangle : CheckCircle2

  // Colores: positivo → palette ALTO, negativo → palette BAJO.
  const palette = LEVEL_META[isPositive ? "alto" : "bajo"]

  // Percent fill: followupScore / totalItemsEvaluados (mín 1 para no dividir por 0).
  const denom = Math.max(1, totalItemsEvaluados)
  const fillPct = Math.min(100, Math.max(0, (followupScore / denom) * 100))

  // Threshold visual: la línea de corte está en 2 ítems.
  const cutoffPct = Math.min(100, (2 / denom) * 100)

  return (
    <Card
      className={cn(
        "w-full max-w-xl border-border/60 shadow-sm ring-1",
        palette.ring,
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full",
                palette.bg,
                palette.text,
              )}
            >
              <ClipboardCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-base font-semibold">
                Resultado Follow-Up M-CHAT-R/F
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Etapa 2 · Edad evaluada: {edadMeses} meses · Stage 1:{" "}
                {scoreStage1}/20
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={cn("font-medium border-0", palette.bg, palette.text)}
          >
            {isPositive ? "Positivo" : "Negativo"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Bar with cutoff marker at 2 items */}
        <div
          role="meter"
          aria-valuemin={0}
          aria-valuemax={denom}
          aria-valuenow={followupScore}
          aria-label={`Follow-Up: ${followupScore} ítems fallan de ${denom}`}
          className="relative"
        >
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className={cn("h-full rounded-full", palette.fill)}
            />
          </div>
          {/* Cutoff line at 2 failed items */}
          {totalItemsEvaluados >= 2 && (
            <div
              className="pointer-events-none absolute inset-y-0 w-0.5 bg-foreground/40"
              style={{ left: `${cutoffPct}%` }}
              aria-hidden="true"
            />
          )}
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>0 fallan</span>
            <span>Corte ≥ 2</span>
            <span>{denom} fallan</span>
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <motion.span
            key={followupScore}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("font-serif text-4xl font-semibold", palette.text)}
          >
            {followupScore}
          </motion.span>
          <span className="text-sm text-muted-foreground">
            / {denom} ítems fallan
          </span>
          {itemsQueFallanFollowup.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">
              Ítems: {itemsQueFallanFollowup.join(", ")}
            </span>
          )}
        </div>

        <p className="text-sm text-foreground/90">
          {isPositive ? (
            <>
              <span className={cn("inline-flex items-center gap-1.5 font-medium", palette.text)}>
                <Icon className="size-4" aria-hidden="true" />
                Resultado positivo
              </span>{" "}
              — el Follow-Up confirma marcadores de riesgo persistentes.
            </>
          ) : (
            <>
              <span className={cn("inline-flex items-center gap-1.5 font-medium", palette.text)}>
                <Icon className="size-4" aria-hidden="true" />
                Resultado negativo
              </span>{" "}
              — el Follow-Up no confirma riesgo significativo.
            </>
          )}
        </p>

        <div className="flex items-start gap-2 rounded-lg bg-secondary/60 p-3 text-sm text-secondary-foreground">
          <Stethoscope className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>{recomendacion}</p>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          MIRA es una herramienta de <strong>cribado</strong>, no de diagnóstico.
          Cualquier confirmación corresponde a un profesional calificado.
        </p>

        <p className="border-t border-border/40 pt-3 text-[10px] leading-relaxed text-muted-foreground">
          M-CHAT-R/F™ Follow-Up © 2009 Diana L. Robins, Deborah Fein, &amp;
          Marianne Barton. Ref: mchatscreen.com
        </p>
      </CardContent>
    </Card>
  )
}
