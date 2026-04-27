"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Baby,
  CheckCircle2,
  Circle,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import type { ChildProfile } from "@/lib/mira-storage"
import {
  getMilestoneBucket,
  getMilestonesForAge,
  getObservedMilestones,
  setObservedMilestones,
  type Milestone,
  type MilestoneCategory,
} from "@/lib/milestones-data"
import { ResourceButtons } from "@/components/mira/resource-dialogs"

export type TriageStep =
  | "intake"
  | "mchat"
  | "risk"
  | "denver"
  | "video"

export type TriageState = {
  intake: boolean
  mchat: boolean
  risk: "bajo" | "medio" | "alto" | null
  denver: boolean
  video: boolean
}

const STEP_ORDER: { key: TriageStep; label: string; hint: string }[] = [
  { key: "intake", label: "Conversación inicial", hint: "Recoger preocupaciones del cuidador" },
  { key: "mchat", label: "Cribado M-CHAT-R/F", hint: "20 ítems validados" },
  { key: "risk", label: "Clasificación de riesgo", hint: "Bajo · Medio · Alto" },
  { key: "denver", label: "Plan Denver (ESDM)", hint: "Ejercicios en rutina" },
  { key: "video", label: "Análisis de video", hint: "Marcadores conductuales" },
]

const CATEGORY_META: Record<
  MilestoneCategory,
  { emoji: string; label: string }
> = {
  social: { emoji: "🤝", label: "Social" },
  language: { emoji: "🗣️", label: "Lenguaje" },
  cognitive: { emoji: "🧠", label: "Cognitivo" },
  motor: { emoji: "🏃", label: "Motor" },
}

function stepDone(state: TriageState, key: TriageStep): boolean {
  switch (key) {
    case "intake":
      return state.intake
    case "mchat":
      return state.mchat
    case "risk":
      return state.risk !== null
    case "denver":
      return state.denver
    case "video":
      return state.video
  }
}

function computeProgress(state: TriageState): number {
  const total = STEP_ORDER.length
  const done = STEP_ORDER.filter((s) => stepDone(state, s.key)).length
  return Math.round((done / total) * 100)
}

const riskToneBadge = (r: TriageState["risk"]) => {
  switch (r) {
    case "bajo":
      return "bg-[color:var(--risk-low)]/15 text-[color:var(--risk-low)]"
    case "medio":
      return "bg-[color:var(--risk-medium)]/20 text-[color:var(--risk-medium)]"
    case "alto":
      return "bg-[color:var(--risk-high)]/15 text-[color:var(--risk-high)]"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function TriageSidebar({
  state,
  childProfile,
}: {
  state: TriageState
  childProfile?: ChildProfile
}) {
  const pct = computeProgress(state)

  return (
    <aside className="flex h-full w-full flex-col gap-5 overflow-y-auto mira-scroll p-5">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="size-5" />
        </span>
        <div>
          <p className="font-serif text-lg font-semibold leading-none">MIRA</p>
          <p className="text-[11px] text-muted-foreground">
            Monitoreo e Intervención de Riesgo de Autismo
          </p>
        </div>
      </div>

      {/* Child context card (only after intake is complete) */}
      {childProfile && (
        <section
          aria-label="Perfil del niño"
          className="rounded-xl border border-primary/20 bg-primary/5 p-3"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Baby className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight text-foreground">
                {childProfile.alias}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {childProfile.ageMonths}{" "}
                {childProfile.ageMonths === 1 ? "mes" : "meses"}
                {childProfile.sex === "M" && " · niño"}
                {childProfile.sex === "F" && " · niña"}
              </p>
            </div>
          </div>
          {childProfile.concerns.length > 0 && (
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
              {childProfile.concerns.length} preocupación
              {childProfile.concerns.length === 1 ? "" : "es"} registrada
              {childProfile.concerns.length === 1 ? "" : "s"}
            </p>
          )}
        </section>
      )}

      {/* Triage progress */}
      <section aria-label="Progreso del triaje" className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Progreso del triaje
          </h2>
          <span className="text-xs text-muted-foreground">{pct}%</span>
        </header>
        <Progress value={pct} className="h-1.5" />

        <ol className="space-y-2">
          {STEP_ORDER.map((s, i) => {
            const done = stepDone(state, s.key)
            const isRiskStep = s.key === "risk"
            return (
              <motion.li
                key={s.key}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-2.5"
              >
                <span className="mt-0.5 shrink-0">
                  {done ? (
                    <CheckCircle2 className="size-4 text-primary" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground/50" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-[13px] font-medium leading-tight",
                      done ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </p>
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    {s.hint}
                  </p>
                  {isRiskStep && state.risk && (
                    <Badge
                      className={cn(
                        "mt-1.5 border-0 capitalize",
                        riskToneBadge(state.risk),
                      )}
                    >
                      {state.risk}
                    </Badge>
                  )}
                </div>
              </motion.li>
            )
          })}
        </ol>
      </section>

      {/* Milestones */}
      <MilestonesSection childProfile={childProfile} />

      {/* Quick resources */}
      <section aria-label="Recursos rápidos" className="space-y-3">
        <header className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recursos rápidos
          </h2>
        </header>
        <ResourceButtons />
      </section>

      <footer className="mt-auto rounded-lg bg-secondary/60 p-3 text-[11px] leading-relaxed text-secondary-foreground">
        <p className="flex items-center gap-1.5 font-medium">
          <MessagesSquare className="size-3.5 text-primary" />
          Cribado, no diagnóstico
        </p>
        <p className="mt-1 text-muted-foreground">
          MIRA orienta y acompaña. El diagnóstico formal lo realiza un
          profesional de salud calificado.
        </p>
      </footer>
    </aside>
  )
}

/* -------------------------------------------------------------------------- */
/*  Milestones section                                                        */
/* -------------------------------------------------------------------------- */

function MilestonesSection({
  childProfile,
}: {
  childProfile?: ChildProfile
}) {
  const ageMonths = childProfile?.ageMonths ?? 0
  const childId = childProfile?.id ?? ""

  const milestones = useMemo(() => getMilestonesForAge(ageMonths), [ageMonths])
  const bucket = useMemo(() => getMilestoneBucket(ageMonths), [ageMonths])

  // Hydrate observed-state from localStorage AFTER mount to avoid an SSR
  // mismatch on the first paint.
  const [observed, setObserved] = useState<Set<string>>(() => new Set())
  useEffect(() => {
    if (!childId) return
    setObserved(new Set(getObservedMilestones(childId)))
  }, [childId])

  function toggle(id: string, next: boolean) {
    setObserved((prev) => {
      const updated = new Set(prev)
      if (next) updated.add(id)
      else updated.delete(id)
      if (childId) setObservedMilestones(childId, [...updated])
      return updated
    })
  }

  // Group milestones by category for cleaner UI scanning.
  const grouped = useMemo(() => {
    const buckets: Record<MilestoneCategory, Milestone[]> = {
      social: [],
      language: [],
      cognitive: [],
      motor: [],
    }
    for (const m of milestones) buckets[m.category].push(m)
    return buckets
  }, [milestones])

  // No bucket yet (under 9 months) — show a soft placeholder.
  if (milestones.length === 0) {
    return (
      <section aria-label="Hitos del desarrollo" className="space-y-3">
        <header className="flex items-center gap-2">
          <Baby className="size-4 text-primary" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Hitos del desarrollo
          </h2>
        </header>
        <p className="rounded-lg border border-dashed border-border/60 bg-muted/40 p-3 text-[12px] leading-relaxed text-muted-foreground">
          Los hitos MIRA se monitorean a partir de los 9 meses. Volveremos a
          mostrarlos cuando {childProfile?.alias ?? "tu hijo/a"} cumpla esa
          edad.
        </p>
      </section>
    )
  }

  const observedCount = milestones.filter((m) => observed.has(m.id)).length
  const redFlagsPending = milestones.filter(
    (m) => m.isRedFlag && !observed.has(m.id),
  ).length

  return (
    <section aria-label="Hitos del desarrollo" className="space-y-3">
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Baby className="size-4 shrink-0 text-primary" />
          <h2 className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Hitos del desarrollo
          </h2>
        </div>
        <Badge variant="outline" className="border-border/60 text-[10px]">
          CDC · {bucket}m
        </Badge>
      </header>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Marca los que ya hayas observado en{" "}
        <strong className="text-foreground">
          {childProfile?.alias ?? "tu hijo/a"}
        </strong>
        . {observedCount} de {milestones.length} marcados.
      </p>

      {redFlagsPending > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-[color:var(--risk-medium)]/30 bg-[color:var(--risk-medium)]/10 px-2.5 py-2 text-[11px] leading-relaxed text-foreground/90">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[color:var(--risk-medium)]" />
          <p>
            {redFlagsPending} hito
            {redFlagsPending === 1 ? "" : "s"} de alarma sin observar. Comenta
            esto con MIRA o tu pediatra.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {(Object.keys(CATEGORY_META) as MilestoneCategory[]).map((cat) => {
          const items = grouped[cat]
          if (items.length === 0) return null
          const meta = CATEGORY_META[cat]
          return (
            <div key={cat} className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/80">
                <span aria-hidden="true">{meta.emoji}</span>
                {meta.label}
              </p>
              <ul className="space-y-1">
                {items.map((m) => {
                  const isChecked = observed.has(m.id)
                  const isAlertable = m.isRedFlag && !isChecked
                  return (
                    <li key={m.id}>
                      <label
                        htmlFor={`ms-${m.id}`}
                        className={cn(
                          "flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 text-[12.5px] leading-snug transition-colors hover:bg-muted/60",
                          isAlertable &&
                            "bg-[color:var(--risk-medium)]/5 hover:bg-[color:var(--risk-medium)]/10",
                        )}
                      >
                        <Checkbox
                          id={`ms-${m.id}`}
                          checked={isChecked}
                          onCheckedChange={(next) =>
                            toggle(m.id, next === true)
                          }
                          aria-describedby={
                            m.isRedFlag ? `ms-${m.id}-flag` : undefined
                          }
                          className="mt-0.5"
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              isChecked
                                ? "text-foreground/70 line-through decoration-foreground/30"
                                : "text-foreground/90",
                            )}
                          >
                            {m.description_es}
                          </span>
                          {isAlertable && (
                            <span
                              id={`ms-${m.id}-flag`}
                              className="ml-1.5 inline-flex items-center align-middle"
                            >
                              <AlertTriangle
                                className="size-3 text-[color:var(--risk-medium)]"
                                aria-label="Señal de alarma si no se observa"
                              />
                            </span>
                          )}
                        </span>
                        {isChecked && (
                          <CheckCircle2
                            className="mt-0.5 size-3.5 shrink-0 text-[color:var(--risk-low)]"
                            aria-hidden="true"
                          />
                        )}
                      </label>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
