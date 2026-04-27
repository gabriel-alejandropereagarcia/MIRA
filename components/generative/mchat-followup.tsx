"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  HelpCircle,
  X,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type Idioma = "es" | "en"

/* ---------------------------------------------------------- *
 *  Datos clínicos: ítem original + preguntas clarificadoras  *
 * ---------------------------------------------------------- */

const STAGE1_ES: Record<number, string> = {
  1: "Si usted señala algo, ¿su hijo/a lo mira?",
  2: "¿Alguna vez se ha preguntado si su hijo/a es sordo/a?",
  3: "¿Su hijo/a juega a imaginar o a hacer juegos de ficción?",
  4: "¿A su hijo/a le gusta subirse a las cosas?",
  5: "¿Hace movimientos inusuales con sus dedos cerca de los ojos?",
  6: "¿Su hijo/a señala con el dedo para pedir algo?",
  7: "¿Su hijo/a señala con el dedo para mostrar algo interesante?",
  8: "¿Su hijo/a muestra interés por otros niños?",
  9: "¿Su hijo/a le muestra cosas acercándolas para que usted las vea?",
  10: "¿Su hijo/a responde cuando usted le llama por su nombre?",
  11: "Cuando le sonríe, ¿él o ella le devuelve la sonrisa?",
  12: "¿Le molestan a su hijo/a ruidos cotidianos?",
  13: "¿Su hijo/a camina solo?",
  14: "¿Le mira a los ojos cuando usted le habla, juega o lo viste?",
  15: "¿Su hijo/a imita sus movimientos?",
  16: "Si usted gira la cabeza, ¿su hijo/a sigue su mirada?",
  17: "¿Hace cosas para que usted le mire o le preste atención?",
  18: "¿Entiende cuando usted le pide que haga algo?",
  19: "Si pasa algo nuevo, ¿le mira a usted para ver cómo reacciona?",
  20: "¿Le gustan los juegos de movimiento?",
}

const STAGE1_EN: Record<number, string> = {
  1: "If you point at something, does your child look at it?",
  2: "Have you ever wondered if your child might be deaf?",
  3: "Does your child play pretend or make-believe?",
  4: "Does your child like climbing on things?",
  5: "Does your child make unusual finger movements near the eyes?",
  6: "Does your child point to ask for something?",
  7: "Does your child point to show you something interesting?",
  8: "Is your child interested in other children?",
  9: "Does your child bring or hold up objects so you can see them?",
  10: "Does your child respond when you call his or her name?",
  11: "When you smile at your child, does he or she smile back?",
  12: "Does your child get upset by everyday noises?",
  13: "Does your child walk independently?",
  14: "Does your child make eye contact when you talk, play, or dress him/her?",
  15: "Does your child try to copy what you do?",
  16: "If you turn your head, does your child look in the same direction?",
  17: "Does your child try to get you to watch or pay attention?",
  18: "Does your child understand simple instructions?",
  19: "If something new happens, does your child look at your face?",
  20: "Does your child like movement activities?",
}

const FOLLOWUP_ES: Record<number, string[]> = {
  1: [
    "¿Mira lo que usted señala CADA VEZ, o solo a veces?",
    "¿Mira el objeto, o solo su mano?",
  ],
  2: [
    "¿Responde a sonidos suaves?",
    "¿Responde cuando le hablan pero no lo ven?",
  ],
  3: [
    "¿Lo ha visto pretender algo (ej.: dar de comer a un muñeco)?",
    "¿Usa objetos como si fueran otra cosa (ej.: una banana como teléfono)?",
  ],
  4: [
    "¿Intenta subirse a sillas, sofás o escaleras?",
    "¿Le gusta que lo suban a sitios altos?",
  ],
  5: [
    "¿Con qué frecuencia hace estos movimientos con los dedos?",
    "¿Los hace solo cuando está emocionado o en cualquier momento?",
  ],
  6: [
    "¿Cómo pide las cosas habitualmente?",
    "¿Lo lleva a usted de la mano, llora, o señala con el dedo?",
  ],
  7: [
    "¿Alguna vez señala algo solo para que usted también lo vea, no para pedirlo?",
    "¿Le mira a usted después de señalar para chequear que mire?",
  ],
  8: [
    "¿Qué hace cuando hay otros niños cerca? ¿Los mira?",
    "¿Se acerca a ellos por iniciativa propia?",
  ],
  9: [
    "¿Le trae juguetes o cosas para mostrárselas?",
    "¿Espera su reacción después de mostrarle algo?",
  ],
  10: [
    "¿Responde las primeras veces que usted lo llama?",
    "¿Responde si no hay distractores (TV, juguete, otra persona)?",
  ],
  11: [
    "¿Le devuelve la sonrisa de forma espontánea?",
    "¿Sonríe solo cuando le hace cosquillas o juegos físicos, o también en interacción tranquila?",
  ],
  12: [
    "¿Qué ruidos le molestan específicamente?",
    "¿Se tapa los oídos o llora con aspiradora, licuadora, secador, etc.?",
  ],
  13: [
    "¿Camina sin sostenerse?",
    "¿Desde qué edad camina solo?",
  ],
  14: [
    "¿Lo mira a los ojos durante la conversación?",
    "¿Solo cuando quiere algo, o también en momentos tranquilos?",
  ],
  15: [
    "¿Copia gestos como aplaudir o decir adiós con la mano?",
    "¿Imita sonidos o palabras?",
  ],
  16: [
    "Si usted mira algo con sorpresa, ¿él o ella mira en la misma dirección?",
    "¿Necesita que usted señale, o le basta con seguir su mirada?",
  ],
  17: [
    "¿Hace cosas para llamar su atención (ej.: payasadas, sonidos)?",
    "¿Lo busca a usted con la mirada cuando logra algo?",
  ],
  18: [
    "¿Entiende instrucciones simples SIN gestos (ej.: «trae tus zapatos» sin que usted señale)?",
    "¿Sigue al menos una instrucción nueva por semana?",
  ],
  19: [
    "Cuando ocurre algo inesperado (ruido fuerte, persona desconocida), ¿le mira a usted para ver su reacción?",
    "¿Cambia su comportamiento según lo que usted hace?",
  ],
  20: [
    "¿Le gusta que lo balanceen, lo columpien o le hagan «avioncito»?",
    "¿Busca activamente este tipo de juego?",
  ],
}

const FOLLOWUP_EN: Record<number, string[]> = {
  1: [
    "Does your child look every time you point, or only sometimes?",
    "Does he or she look at the object, or just at your hand?",
  ],
  2: [
    "Does your child respond to soft sounds?",
    "Does he or she respond when spoken to from out of sight?",
  ],
  3: [
    "Have you seen your child pretend (e.g., feed a doll)?",
    "Does he or she use objects as if they were something else (e.g., banana as a phone)?",
  ],
  4: [
    "Does your child try to climb chairs, sofas, or stairs?",
    "Does he or she like being lifted up high?",
  ],
  5: [
    "How often does your child make those finger movements?",
    "Does he or she only do them when excited, or any time?",
  ],
  6: [
    "How does your child usually ask for things?",
    "Does he or she lead you by the hand, cry, or point with one finger?",
  ],
  7: [
    "Does your child ever point at something just so you can see it, not to ask for it?",
    "Does he or she look at you after pointing to make sure you see?",
  ],
  8: [
    "What does your child do around other children? Does he or she watch them?",
    "Does he or she approach them on their own?",
  ],
  9: [
    "Does your child bring you toys or things to show them?",
    "Does he or she wait for your reaction after showing something?",
  ],
  10: [
    "Does your child respond the first few times you call?",
    "Does he or she respond when there are no distractions (TV, toy, other people)?",
  ],
  11: [
    "Does your child smile back spontaneously?",
    "Only with tickling or rough play, or also in quiet interaction?",
  ],
  12: [
    "Which everyday noises bother your child specifically?",
    "Does he or she cover the ears or cry with vacuum, blender, hair dryer, etc.?",
  ],
  13: [
    "Does your child walk without holding on?",
    "Since what age has he or she been walking?",
  ],
  14: [
    "Does your child make eye contact during conversation?",
    "Only when he or she wants something, or also in calm moments?",
  ],
  15: [
    "Does your child copy gestures like clapping or waving goodbye?",
    "Does he or she imitate sounds or words?",
  ],
  16: [
    "If you look at something with surprise, does your child look the same way?",
    "Does your child need you to point, or is following your gaze enough?",
  ],
  17: [
    "Does your child do things to get your attention (silly faces, sounds)?",
    "Does he or she look back at you after accomplishing something?",
  ],
  18: [
    "Does your child understand simple instructions WITHOUT gestures (e.g., 'bring your shoes' without pointing)?",
    "Does he or she follow at least one new instruction per week?",
  ],
  19: [
    "When something unexpected happens (loud noise, stranger), does your child look at you?",
    "Does he or she change behavior based on what you do?",
  ],
  20: [
    "Does your child enjoy being rocked, swung, or 'flown' through the air?",
    "Does he or she actively seek out that kind of play?",
  ],
}

/* ---------------------------------------------------------- *
 *  Componente                                                *
 * ---------------------------------------------------------- */

type Decision = "pasa" | "falla"

type Props = {
  itemsFallados: number[]
  edadMeses: number
  idioma: Idioma
  onSubmit: (result: {
    resultados_followup: Array<{ item: number; pasa: boolean }>
    edad_meses: number
    cancelado: boolean
  }) => void
  disabled?: boolean
}

export function MchatFollowUp({
  itemsFallados,
  edadMeses,
  idioma,
  onSubmit,
  disabled,
}: Props) {
  // Defensive: deduplicate and sort, ignore out-of-range numbers (1-20).
  const items = useMemo(
    () =>
      Array.from(new Set(itemsFallados))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 20)
        .sort((a, b) => a - b),
    [itemsFallados],
  )

  const [idx, setIdx] = useState(0)
  const [decisions, setDecisions] = useState<Record<number, Decision | null>>(
    () => Object.fromEntries(items.map((n) => [n, null])),
  )

  const stage1 = idioma === "en" ? STAGE1_EN : STAGE1_ES
  const followup = idioma === "en" ? FOLLOWUP_EN : FOLLOWUP_ES
  const t =
    idioma === "en"
      ? {
          title: "M-CHAT-R/F Follow-Up Interview",
          badge: "Follow-Up",
          subtitle: (i: number, n: number) => `Item ${i + 1} of ${n} flagged`,
          ageLabel: `Child age: ${edadMeses} months`,
          itemHeader: (n: number) => `Item ${n} — original question`,
          clarifyHeader: "Clarifying questions",
          decisionPrompt: "Based on the answers above, the behavior:",
          pass: "Passes",
          passHint: "The behavior IS present",
          fail: "Fails",
          failHint: "The behavior is absent or atypical",
          back: "Back",
          next: "Next",
          submit: "Submit follow-up",
          cancel: "Cancel",
          progress: (a: number, n: number) => `${a}/${n} reviewed`,
          empty: "No flagged items to review.",
        }
      : {
          title: "Entrevista de seguimiento M-CHAT-R/F",
          badge: "Follow-Up",
          subtitle: (i: number, n: number) =>
            `Ítem ${i + 1} de ${n} fallados`,
          ageLabel: `Edad del niño/a: ${edadMeses} meses`,
          itemHeader: (n: number) => `Ítem ${n} — pregunta original`,
          clarifyHeader: "Preguntas de clarificación",
          decisionPrompt: "Según las respuestas anteriores, el comportamiento:",
          pass: "PASA",
          passHint: "El comportamiento SÍ está presente",
          fail: "FALLA",
          failHint: "El comportamiento está ausente o es atípico",
          back: "Atrás",
          next: "Siguiente",
          submit: "Enviar Follow-Up",
          cancel: "Cancelar",
          progress: (a: number, n: number) => `${a}/${n} revisados`,
          empty: "No hay ítems para revisar.",
        }

  if (items.length === 0) {
    return (
      <Card className="w-full max-w-xl border-border/60 shadow-sm">
        <CardContent className="p-6 text-sm text-muted-foreground">
          {t.empty}
        </CardContent>
      </Card>
    )
  }

  const currentItem = items[idx]
  const currentDecision = decisions[currentItem]
  const reviewed = items.filter((n) => decisions[n] !== null).length
  const allReviewed = reviewed === items.length
  const progress = ((idx + 1) / items.length) * 100

  function decide(value: Decision) {
    setDecisions((prev) => ({ ...prev, [currentItem]: value }))
    if (idx < items.length - 1) {
      // Subtle delay so the user sees their choice register.
      setTimeout(() => setIdx((i) => i + 1), 200)
    }
  }

  function submit() {
    if (!allReviewed) return
    onSubmit({
      resultados_followup: items.map((n) => ({
        item: n,
        pasa: decisions[n] === "pasa",
      })),
      edad_meses: edadMeses,
      cancelado: false,
    })
  }

  function cancel() {
    onSubmit({
      resultados_followup: [],
      edad_meses: edadMeses,
      cancelado: true,
    })
  }

  const clarifyQuestions = followup[currentItem] ?? []

  return (
    <Card className="w-full max-w-xl border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ClipboardCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-base font-semibold leading-tight">
                {t.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t.subtitle(idx, items.length)} · {t.ageLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="secondary"
              className="border-0 bg-primary/10 text-primary"
            >
              {t.badge}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={cancel}
              disabled={disabled}
              aria-label={t.cancel}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
        <Progress value={progress} className="mt-2 h-1.5" />
      </CardHeader>

      <CardContent className="space-y-5">
        <motion.div
          key={currentItem}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Original Stage 1 question */}
          <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t.itemHeader(currentItem)}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/90">
              {stage1[currentItem]}
            </p>
          </div>

          {/* Clarifying questions */}
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <HelpCircle className="size-3.5" aria-hidden="true" />
              {t.clarifyHeader}
            </p>
            <ul className="space-y-2">
              {clarifyQuestions.map((q, qi) => (
                <li
                  key={qi}
                  className="flex gap-2 rounded-md bg-card p-3 text-sm leading-relaxed text-foreground ring-1 ring-border/50"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {qi + 1}
                  </span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pasa / Falla decision */}
          <div className="space-y-2">
            <p className="text-[12px] font-medium text-foreground">
              {t.decisionPrompt}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={currentDecision === "pasa" ? "default" : "outline"}
                size="lg"
                onClick={() => decide("pasa")}
                disabled={disabled}
                className={cn(
                  "h-auto flex-col gap-1 py-3 text-base",
                  currentDecision === "pasa" &&
                    "bg-[color:var(--risk-low)] text-white hover:bg-[color:var(--risk-low)]/90",
                )}
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  {t.pass}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-normal opacity-80",
                    currentDecision === "pasa"
                      ? "text-white/90"
                      : "text-muted-foreground",
                  )}
                >
                  {t.passHint}
                </span>
              </Button>
              <Button
                type="button"
                variant={currentDecision === "falla" ? "default" : "outline"}
                size="lg"
                onClick={() => decide("falla")}
                disabled={disabled}
                className={cn(
                  "h-auto flex-col gap-1 py-3 text-base",
                  currentDecision === "falla" &&
                    "bg-[color:var(--risk-medium)] text-white hover:bg-[color:var(--risk-medium)]/90",
                )}
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <XCircle className="size-4" aria-hidden="true" />
                  {t.fail}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-normal opacity-80",
                    currentDecision === "falla"
                      ? "text-white/90"
                      : "text-muted-foreground",
                  )}
                >
                  {t.failHint}
                </span>
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center justify-between pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIdx(Math.max(0, idx - 1))}
            disabled={idx === 0 || disabled}
          >
            <ChevronLeft className="size-4" />
            {t.back}
          </Button>

          <span className="text-xs text-muted-foreground">
            {t.progress(reviewed, items.length)}
          </span>

          {idx < items.length - 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIdx(Math.min(items.length - 1, idx + 1))}
              disabled={currentDecision === null || disabled}
            >
              {t.next}
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={submit}
              disabled={!allReviewed || disabled}
            >
              {t.submit}
            </Button>
          )}
        </div>

        <p className="border-t border-border/40 pt-3 text-center text-[10px] leading-relaxed text-muted-foreground">
          M-CHAT-R/F™ Follow-Up © 2009 Diana L. Robins, Deborah Fein, &amp;
          Marianne Barton. Ref: mchatscreen.com
        </p>
      </CardContent>
    </Card>
  )
}
