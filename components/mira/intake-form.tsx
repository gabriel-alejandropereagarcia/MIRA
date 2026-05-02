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

type Locale = "es" | "en"

const CONCERNS_ES = [
  { id: "habla", label: "No habla o habla poco para su edad" },
  { id: "ojos", label: "No mira a los ojos" },
  { id: "nombre", label: "No responde cuando lo llaman por su nombre" },
  { id: "repetitivo", label: "Hace movimientos repetitivos (aleteo, girar objetos)" },
  { id: "senalar", label: "No señala con el dedo" },
  { id: "jugar", label: "No juega con otros niños" },
  { id: "otro", label: "Otra preocupación" },
] as const

const CONCERNS_EN = [
  { id: "habla", label: "Not speaking or limited speech for their age" },
  { id: "ojos", label: "Doesn't make eye contact" },
  { id: "nombre", label: "Doesn't respond to their name" },
  { id: "repetitivo", label: "Repetitive movements (hand flapping, spinning objects)" },
  { id: "senalar", label: "Doesn't point with finger" },
  { id: "jugar", label: "Doesn't play with other children" },
  { id: "otro", label: "Other concern" },
] as const

const GUARDIANS_ES = [
  { value: "madre", label: "Madre" },
  { value: "padre", label: "Padre" },
  { value: "tutor", label: "Tutor/a" },
  { value: "profesional", label: "Profesional de salud" },
] as const

const GUARDIANS_EN = [
  { value: "madre", label: "Mother" },
  { value: "padre", label: "Father" },
  { value: "tutor", label: "Guardian" },
  { value: "profesional", label: "Health professional" },
] as const

type Props = {
  onComplete: (profile: ChildProfile) => void
  // Optional callback so the parent can mirror the chosen language in
  // surrounding chrome (e.g. the "How it works" link, page metadata, etc).
  onLocaleChange?: (locale: Locale) => void
}

export function IntakeForm({ onComplete, onLocaleChange }: Props) {
  const [locale, setLocaleState] = useState<Locale>("es")

  // Keep parent in sync any time the user toggles the language pill.
  const setLocale = (next: Locale) => {
    setLocaleState(next)
    onLocaleChange?.(next)
  }
  const [alias, setAlias] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [sex, setSex] = useState<Sex | "">("")
  const [guardian, setGuardian] = useState<string>("")
  const [concerns, setConcerns] = useState<string[]>([])
  const [consent, setConsent] = useState(false)

  // Texts object for easy bilingual switching
  const t = locale === "en" ? translations.en : translations.es

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
      locale,
      createdAt: new Date().toISOString(),
    }

    saveProfile(profile)
    console.log("[v0] intake: saved profile", profile.id, profile.ageMonths, "months", "locale", locale)
    onComplete(profile)
  }

  const concerns_list = locale === "en" ? CONCERNS_EN : CONCERNS_ES
  const guardians_list = locale === "en" ? GUARDIANS_EN : GUARDIANS_ES

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-[480px] px-4 py-8 md:py-12"
    >
      {/* Language toggle */}
      <div className="mb-6 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setLocale("es")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            locale === "es"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          🇪🇸 Español
        </button>
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            locale === "en"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          🇬🇧 English
        </button>
      </div>

      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
          <Sparkles className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            MIRA
          </p>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {t.subtitle}
          </p>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-1.5">
          <CardTitle className="font-serif text-xl font-semibold text-balance">
            {t.title}
          </CardTitle>
          <CardDescription className="text-pretty">
            {t.description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Alias */}
            <div className="space-y-2">
              <Label htmlFor="alias">
                {t.aliasLabel} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="alias"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder={t.aliasPlaceholder}
                autoComplete="off"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                {t.aliasHint}
              </p>
            </div>

            {/* Birth date */}
            <div className="space-y-2">
              <Label htmlFor="birthDate">
                {t.birthdateLabel} <span className="text-destructive">*</span>
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
                    {ageMonths} {ageMonths === 1 ? t.monthSingular : t.monthPlural}
                  </Badge>
                )}
              </div>
              {ageOutOfRange && (
                <p
                  role="alert"
                  className="text-[12px] text-destructive"
                >
                  {t.ageOutOfRange}
                </p>
              )}
              {showMchatNotice && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <p>{t.mchatNotice}</p>
                </div>
              )}
            </div>

            {/* Sex */}
            <div className="space-y-2">
              <Label>
                {t.sexLabel} <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={sex}
                onValueChange={(v) => setSex(v as Sex)}
                className="flex flex-wrap gap-x-6 gap-y-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="sex-m" value="M" />
                  <Label htmlFor="sex-m" className="font-normal">
                    {t.sexBoy}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="sex-f" value="F" />
                  <Label htmlFor="sex-f" className="font-normal">
                    {t.sexGirl}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="sex-o" value="otro" />
                  <Label htmlFor="sex-o" className="font-normal">
                    {t.sexPreferNotToSay}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Guardian */}
            <div className="space-y-2">
              <Label htmlFor="guardian">
                {t.guardianLabel} <span className="text-destructive">*</span>
              </Label>
              <Select value={guardian} onValueChange={setGuardian}>
                <SelectTrigger id="guardian">
                  <SelectValue placeholder={t.selectPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {guardians_list.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Concerns */}
            <div className="space-y-2">
              <Label>{t.concernsLabel}</Label>
              <p className="text-[11px] text-muted-foreground">
                {t.concernsHint}
              </p>
              <div className="space-y-2 pt-1">
                {concerns_list.map((c) => {
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
                  {t.consentText}
                </span>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              size="lg"
              disabled={!canSubmit}
            >
              {t.submitButton}
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

const translations = {
  es: {
    subtitle: "Cribado del desarrollo",
    title: "Antes de comenzar",
    description: "Cuéntanos sobre tu hijo/a para personalizar la experiencia.",
    aliasLabel: "Alias del niño/a",
    aliasPlaceholder: "Ej: Mateo, mi pequeña...",
    aliasHint: "Puedes usar cualquier nombre. No se comparte fuera de esta sesión.",
    birthdateLabel: "Fecha de nacimiento",
    monthSingular: "mes",
    monthPlural: "meses",
    ageOutOfRange: "Edad fuera del rango soportado (0–72 meses).",
    mchatNotice:
      "El M-CHAT-R/F está diseñado para niños de 16–30 meses. MIRA puede orientarte sobre hitos del desarrollo para la edad de tu hijo/a, pero el cuestionario formal no aplica.",
    sexLabel: "Sexo",
    sexBoy: "Niño",
    sexGirl: "Niña",
    sexPreferNotToSay: "Prefiero no decir",
    guardianLabel: "¿Quién completa?",
    selectPlaceholder: "Selecciona una opción",
    concernsLabel: "Preocupaciones principales",
    concernsHint: "Selecciona todas las que apliquen. Puedes omitir si no aplica ninguna.",
    consentText:
      'Entiendo que MIRA es una herramienta de cribado y orientación, NO de diagnóstico. Los resultados no reemplazan la evaluación de un profesional de salud calificado. Acepto el uso de mis respuestas únicamente para generar recomendaciones dentro de esta sesión.',
    submitButton: "Comenzar evaluación",
  },
  en: {
    subtitle: "Developmental screening",
    title: "Before we start",
    description: "Tell us about your child to personalize the experience.",
    aliasLabel: "Child's name or alias",
    aliasPlaceholder: "E.g., Emma, my little one...",
    aliasHint: "You can use any name. It is not shared outside this session.",
    birthdateLabel: "Date of birth",
    monthSingular: "month",
    monthPlural: "months",
    ageOutOfRange: "Age outside the supported range (0–72 months).",
    mchatNotice:
      "The M-CHAT-R/F is designed for children 16–30 months old. MIRA can guide you on developmental milestones for your child's age, but the formal questionnaire does not apply.",
    sexLabel: "Sex",
    sexBoy: "Boy",
    sexGirl: "Girl",
    sexPreferNotToSay: "Prefer not to say",
    guardianLabel: "Who is completing this?",
    selectPlaceholder: "Select an option",
    concernsLabel: "Main concerns",
    concernsHint: "Select all that apply. You may skip this if no concerns apply.",
    consentText:
      "I understand that MIRA is a screening and guidance tool, NOT a diagnostic tool. Results do not replace evaluation by a qualified health professional. I agree that my responses will be used only to generate recommendations within this session.",
    submitButton: "Start screening",
  },
}
