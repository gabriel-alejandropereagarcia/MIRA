"use client"

import { motion } from "framer-motion"
import { Sparkles, Clock, Target } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Ejercicio = {
  titulo: string
  duracion: string
  pasos: readonly string[] | string[]
}

type Props = {
  edadMeses: number
  nivelRiesgo: "medio" | "alto"
  areaFoco: string
  contextoDiario: string
  ejercicios: Ejercicio[]
  principioClave: string
}

const AREA_LABEL: Record<string, string> = {
  imitacion: "Imitación",
  comunicacion_no_verbal: "Comunicación no verbal",
  juego_simbolico: "Juego simbólico",
  atencion_conjunta: "Atención conjunta",
}

const CONTEXT_LABEL: Record<string, string> = {
  juego_piso: "Juego en el piso",
  hora_comida: "Hora de la comida",
  vestirse: "Al vestirse",
  bano: "Hora del baño",
}

export function DenverCards({
  edadMeses,
  areaFoco,
  contextoDiario,
  ejercicios,
  principioClave,
}: Props) {
  return (
    <div className="w-full max-w-2xl space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="secondary" className="gap-1 bg-accent/30 text-foreground">
          <Target className="size-3" />
          {AREA_LABEL[areaFoco] ?? areaFoco}
        </Badge>
        <Badge variant="outline" className="border-border/70">
          {edadMeses} meses
        </Badge>
        <Badge variant="outline" className="border-border/70">
          {CONTEXT_LABEL[contextoDiario] ?? contextoDiario}
        </Badge>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-foreground/90">
          <span className="font-medium text-primary">Principio Denver: </span>
          {principioClave}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {ejercicios.map((ej, idx) => (
          <motion.div
            key={ej.titulo}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
          >
            <Card className="h-full border-border/60 transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-serif text-base font-semibold leading-tight">
                    {ej.titulo}
                  </h4>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                    <Clock className="size-3" />
                    {ej.duracion}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ol className="space-y-2 text-sm text-foreground/85">
                  {ej.pasos.map((paso, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/40 text-[11px] font-semibold text-accent-foreground">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{paso}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
