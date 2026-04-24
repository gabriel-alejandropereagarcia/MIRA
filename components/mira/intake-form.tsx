"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Info, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  ageInMonths,
  saveProfile,
  type ChildProfile,
  type Sex,
} from "@/lib/mira-storage"

const CONCERNS = [
  { id: "habla", label: "No habla o habla poco para su edad" },
  { id: "ojos", label: "No mira a los ojos" },
  { id: "nombre", label: "No responde cuando lo llaman por su nombre" },
  { id: "repetitivo", label: "Hace movimientos repetitivos (aleteo, girar objetos)" },
  { id: "senalar", label: "No señala con el dedo" },
  { id: "jugar", label: "No juega con otros niños" },
  { id: "otro", label: "Otra preocupación" },
] as const

const GUARDIANS = [
  { value: "madre", label: "Madre" },
  { value: "padre", label: "Padre" },
  { value: "tutor", label: "Tutor/a" },
  { value: "profesional", label: "Profesional de salud" },
] as const

type Props = {
  onComplete: (profile: ChildProfile) => void
}

export function IntakeForm({ onComplete }: Props) {
  const [alias, setAlias] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [sex, setSex] = useState<Sex | "">("")
  const [guardian, setGuardian] = useState<string>("")
  const [concerns, setConcerns] = useState<string[]>([])
  const [consent, setConsent] = useState(false)

  // Compute the derived age and M-CHAT applicability on every render.
  const ageMonths = useMemo(
    () => (birthDate ? ageInMonths(birthDate) : null),
    [birthDate],
  )

  const ageOutOfRange =
    ageMonths !== null && (ageMonths < 0 || ageMonths > 72)
  const mchatApplies =
    ageMonths !== null && ageMonths >= 16 && ageMonths <= 30
  const showMchatNotice =
    ageMonths !== null && !ageOutOfRange && !mchatApplies

  const canSubmit =
    alias.trim().length > 0 &&
    birthDate.length > 0 &&
    !ageOutOfRange &&
    sex !== "" &&
    guardian !== "" &&
    consent

  const toggleConcern = (id: string) => {
    setConcerns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || ageMonths === null) return

    const profile: ChildProfile = {
      id: crypto.randomUUID(),
      alias: alias.trim(),
      birthDate,
      ageMonths,
      sex: sex as Sex,
      guardian,
      concerns,
      createdAt: new Date().toISOString(),
    }

    saveProfile(profile)
    console.log("[v0] intake: saved profile", profile.id, profile.ageMonths, "months")
    onComplete(profile)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-[480px] px-4 py-8 md:py-12"
    >
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
          <Sparkles className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            MIRA
          </p>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Cribado del desarrollo
          </p>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-1.5">
          <CardTitle className="font-serif text-xl font-semibold text-balance">
            Antes de comenzar
          </CardTitle>
          <CardDescription className="text-pretty">
            Cuéntanos sobre tu hijo/a para personalizar la experiencia.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Alias */}
            <div className="space-y-2">
              <Label htmlFor="alias">
                Alias del niño/a <span className="text-destructive">*</span>
              </Label>
              <Input
                id="alias"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Ej: Mateo, mi pequeña..."
                autoComplete="off"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Puedes usar cualquier nombre. No se comparte fuera de esta sesión.
              </p>
            </div>

            {/* Birth date */}
            <div className="space-y-2">
              <Label htmlFor="birthDate">
                Fecha de nacimiento <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  required
                  className="flex-1"
                />
                {ageMonths !== null && !ageOutOfRange && (
                  <Badge
                    variant="secondary"
                    className="shrink-0 border-primary/20 bg-primary/10 text-primary"
                  >
                    {ageMonths} {ageMonths === 1 ? "mes" : "meses"}
                  </Badge>
                )}
              </div>
              {ageOutOfRange && (
                <p
                  role="alert"
                  className="text-[12px] text-destructive"
                >
                  Edad fuera del rango soportado (0–72 meses).
                </p>
              )}
              {showMchatNotice && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <p>
                    El M-CHAT-R/F está diseñado para niños de{" "}
                    <strong>16–30 meses</strong>. MIRA puede orientarte sobre
                    hitos del desarrollo para la edad de tu hijo/a, pero el
                    cuestionario formal no aplica.
                  </p>
                </div>
              )}
            </div>

            {/* Sex */}
            <div className="space-y-2">
              <Label>
                Sexo <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={sex}
                onValueChange={(v) => setSex(v as Sex)}
                className="flex flex-wrap gap-x-6 gap-y-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="sex-m" value="M" />
                  <Label htmlFor="sex-m" className="font-normal">
                    Niño
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="sex-f" value="F" />
                  <Label htmlFor="sex-f" className="font-normal">
                    Niña
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="sex-o" value="otro" />
                  <Label htmlFor="sex-o" className="font-normal">
                    Prefiero no decir
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Guardian */}
            <div className="space-y-2">
              <Label htmlFor="guardian">
                ¿Quién completa? <span className="text-destructive">*</span>
              </Label>
              <Select value={guardian} onValueChange={setGuardian}>
                <SelectTrigger id="guardian">
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  {GUARDIANS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Concerns */}
            <div className="space-y-2">
              <Label>Preocupaciones principales</Label>
              <p className="text-[11px] text-muted-foreground">
                Selecciona todas las que apliquen. Puedes omitir si no aplica
                ninguna.
              </p>
              <div className="space-y-2 pt-1">
                {CONCERNS.map((c) => {
                  const checked = concerns.includes(c.id)
                  return (
                    <label
                      key={c.id}
                      htmlFor={`concern-${c.id}`}
                      className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/50 bg-card px-3 py-2 text-sm transition-colors hover:bg-accent/40"
                    >
                      <Checkbox
                        id={`concern-${c.id}`}
                        checked={checked}
                        onCheckedChange={() => toggleConcern(c.id)}
                        className="mt-0.5"
                      />
                      <span className="leading-snug">{c.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Consent */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <label
                htmlFor="consent"
                className="flex cursor-pointer items-start gap-2.5"
              >
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(v) => setConsent(v === true)}
                  className="mt-0.5"
                  required
                />
                <span className="text-[12px] leading-relaxed text-foreground/90">
                  Entiendo que MIRA es una herramienta de{" "}
                  <strong>cribado y orientación, NO de diagnóstico</strong>. Los
                  resultados no reemplazan la evaluación de un profesional de
                  salud calificado. Acepto el uso de mis respuestas únicamente
                  para generar recomendaciones dentro de esta sesión.
                </span>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              size="lg"
              disabled={!canSubmit}
            >
              Comenzar evaluación
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
        M-CHAT-R/F™ © 2009 Diana L. Robins, Deborah Fein, & Marianne Barton.
        <br />
        Ref: mchatscreen.com
      </p>
    </motion.div>
  )
}
