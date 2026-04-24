"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { ClipboardList, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type Idioma = "es" | "en"

const ITEMS_ES: string[] = [
  "Si usted señala algo al otro lado de la habitación, ¿su hijo/a lo mira?",
  "¿Alguna vez se ha preguntado si su hijo/a es sordo/a?",
  "¿Su hijo/a juega a imaginar o hacer juegos de ficción?",
  "¿A su hijo/a le gusta subirse a las cosas?",
  "¿Hace movimientos inusuales con sus dedos cerca de sus ojos?",
  "¿Su hijo/a señala con el dedo para pedir algo o pedir ayuda?",
  "¿Su hijo/a señala con un dedo para mostrarle algo interesante?",
  "¿Su hijo/a muestra interés por otros niños?",
  "¿Su hijo/a le muestra cosas acercándolas o levantándolas para que usted las vea?",
  "¿Su hijo/a responde cuando usted le llama por su nombre?",
  "¿Cuándo usted sonríe a su hijo/a, él o ella también le sonríe?",
  "¿Le molestan a su hijo/a ruidos cotidianos?",
  "¿Su hijo/a camina solo?",
  "¿Su hijo/a le mira a los ojos cuando le habla, juega o lo viste?",
  "¿Su hijo/a imita sus movimientos?",
  "Si usted se gira a ver algo, ¿su hijo/a trata de mirar hacia lo que usted está mirando?",
  "¿Su hijo/a intenta que usted le mire o le preste atención?",
  "¿Su hijo/a le entiende cuando usted le dice que haga algo?",
  "Si algo nuevo pasa, ¿su hijo/a le mira para ver cómo reacciona?",
  "¿Le gustan a su hijo/a los juegos de movimiento?",
]

const ITEMS_EN: string[] = [
  "If you point at something across the room, does your child look at it?",
  "Have you ever wondered if your child might be deaf?",
  "Does your child play pretend or make-believe?",
  "Does your child like climbing on things?",
  "Does your child make unusual finger movements near his or her eyes?",
  "Does your child point with one finger to ask for something or to get help?",
  "Does your child point with one finger to show you something interesting?",
  "Is your child interested in other children?",
  "Does your child show you things by bringing them to you or holding them up for you to see?",
  "Does your child respond when you call his or her name?",
  "When you smile at your child, does he or she smile back at you?",
  "Does your child get upset by everyday noises?",
  "Does your child walk?",
  "Does your child look you in the eye when you are talking to him or her, playing, or dressing him or her?",
  "Does your child try to copy what you do?",
  "If you turn your head to look at something, does your child look around to see what you are looking at?",
  "Does your child try to get you to watch him or her?",
  "Does your child understand when you tell him or her to do something?",
  "If something new happens, does your child look at your face to see how you feel about it?",
  "Does your child like movement activities?",
]

type Props = {
  edadMeses: number
  idioma: Idioma
  onSubmit: (result: {
    respuestas: boolean[]
    edad_meses: number
    cancelado: boolean
  }) => void
  disabled?: boolean
}

export function MchatQuestionnaire({
  edadMeses,
  idioma,
  onSubmit,
  disabled,
}: Props) {
  const items = idioma === "en" ? ITEMS_EN : ITEMS_ES
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<(boolean | null)[]>(
    Array(20).fill(null),
  )

  const progress = useMemo(() => ((idx + 1) / 20) * 100, [idx])
  const current = answers[idx]
  const answered = answers.filter((a) => a !== null).length

  function answer(val: boolean) {
    const next = [...answers]
    next[idx] = val
    setAnswers(next)
    if (idx < 19) setTimeout(() => setIdx(idx + 1), 180)
  }

  function submit() {
    if (answers.some((a) => a === null)) return
    onSubmit({
      respuestas: answers as boolean[],
      edad_meses: edadMeses,
      cancelado: false,
    })
  }

  const t = idioma === "en"
    ? {
        title: "M-CHAT-R/F Questionnaire",
        subtitle: `Child age: ${edadMeses} months · Question ${idx + 1} of 20`,
        yes: "Yes",
        no: "No",
        back: "Back",
        next: "Next",
        submit: "Submit answers",
        cancel: "Cancel",
        completed: `${answered}/20 answered`,
      }
    : {
        title: "Cuestionario M-CHAT-R/F",
        subtitle: `Edad del niño/a: ${edadMeses} meses · Pregunta ${idx + 1} de 20`,
        yes: "Sí",
        no: "No",
        back: "Atrás",
        next: "Siguiente",
        submit: "Enviar respuestas",
        cancel: "Cancelar",
        completed: `${answered}/20 respondidas`,
      }

  const allAnswered = answered === 20

  return (
    <Card className="w-full max-w-xl border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ClipboardList className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base font-semibold">
                {t.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              onSubmit({ respuestas: [], edad_meses: edadMeses, cancelado: true })
            }
            disabled={disabled}
            aria-label={t.cancel}
          >
            <X className="size-4" />
          </Button>
        </div>
        <Progress value={progress} className="mt-2 h-1.5" />
      </CardHeader>

      <CardContent className="space-y-5">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="min-h-[72px] rounded-lg bg-secondary/50 p-4"
        >
          <p className="text-[13px] font-medium text-muted-foreground">
            {idioma === "en" ? "Item" : "Ítem"} {idx + 1}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {items[idx]}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={current === true ? "default" : "outline"}
            size="lg"
            className={cn(
              "h-12 text-base",
              current === true && "shadow-sm",
            )}
            onClick={() => answer(true)}
            disabled={disabled}
          >
            {t.yes}
          </Button>
          <Button
            type="button"
            variant={current === false ? "default" : "outline"}
            size="lg"
            className={cn(
              "h-12 text-base",
              current === false && "shadow-sm",
            )}
            onClick={() => answer(false)}
            disabled={disabled}
          >
            {t.no}
          </Button>
        </div>

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

          <span className="text-xs text-muted-foreground">{t.completed}</span>

          {idx < 19 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIdx(Math.min(19, idx + 1))}
              disabled={current === null || disabled}
            >
              {t.next}
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={submit}
              disabled={!allAnswered || disabled}
            >
              {t.submit}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
