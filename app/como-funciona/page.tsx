"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  Cpu,
  FileText,
  Heart,
  MessageCircle,
  RefreshCw,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Locale = "es" | "en"

/**
 * Centralised copy. Adding a new language only requires a new key here
 * — no JSX duplication. We intentionally keep this dictionary in the
 * page itself (instead of a global i18n setup) because /como-funciona
 * is a marketing surface that has zero overlap with the clinical
 * vocabulary used inside the app.
 */
const COPY = {
  es: {
    backToApp: "Volver a MIRA",
    heroTitle: "Cada niño merece ser visto a tiempo",
    heroLead:
      "MIRA es una herramienta de detección temprana del autismo, accesible, gratis y bilingüe. Pensada para familias, desde los 18 meses.",
    badgeHack: "Built for the Vercel Hackathon",
    badgeTrack: "Track 1: Workflows",
    ctaApp: "Ir a MIRA",
    ctaMore: "Conoce más",
    sectionWhat: "¿Qué es MIRA?",
    cards: [
      {
        title: "No es diagnóstico",
        desc: "MIRA es una herramienta de cribado y orientación. Ningún resultado reemplaza la evaluación de un profesional calificado.",
      },
      {
        title: "Para las familias",
        desc: "Diseñada pensando en padres y cuidadores. Interfaz simple, empática, sin jerga médica innecesaria.",
      },
      {
        title: "El tiempo importa",
        desc: "La detección temprana abre puertas. Intervenciones tempranas marcan la diferencia en el desarrollo infantil.",
      },
    ],
    sectionHow: "Cómo funciona",
    steps: [
      {
        title: "1. Conversación",
        desc: "Cuéntanos sobre tu hijo/a: edad, preocupaciones, contexto familiar.",
      },
      {
        title: "2. M-CHAT-R/F",
        desc: "20 preguntas validadas científicamente para detectar señales de riesgo.",
      },
      {
        title: "3. Video IA",
        desc: "Opcionalmente, sube un video corto para que Gemini analice conductas objetivamente.",
      },
      {
        title: "4. Triangulación",
        desc: "Cruzamos cuestionario + hitos del desarrollo + video para decisiones sólidas.",
      },
      {
        title: "5. PDF",
        desc: "Informe profesional listo para llevar al pediatra o especialista.",
      },
    ],
    agentTitle: "Un agente que no se olvida de ningún niño",
    agentLead: (
      <>
        MIRA usa <strong>Vercel Workflows (WDK)</strong> para convertirse en un{" "}
        <em>agente durable</em>. Una vez termina el screening y el PDF se descarga:
      </>
    ),
    agentBullets: [
      <>
        <strong>Se pausa</strong> por 7, 15, 30 o 90 días según nivel de riesgo
      </>,
      <>
        <strong>Reintentos automáticos</strong> si algo falla (sin tu intervención)
      </>,
      <>
        <strong>Después del tiempo</strong>, envía un recordatorio para reevaluación
      </>,
    ],
    codeBlock: `// Tiempos clínicos calibrados
ALTO = 7 días (M-CHAT alto o Follow-Up positivo)
MEDIO = 15 días (M-CHAT medio)
BAJO_DUDAS = 30 días (Triangulación pendiente)
BAJO = 90 días (Seguimiento rutinario)`,
    sectionStack: "Stack Tecnológico",
    sectionBeyondTitle: "Más allá del hackathon",
    sectionBeyondLead:
      "MIRA no termina aquí. Está diseñada para crecer. Necesitamos:",
    collaborators: [
      "Pediatras — para validación clínica",
      "Familias — tus historias importan",
      "Desarrolladores — código libre",
      "ONGs — alcance en comunidades",
    ],
    ctaCollab: "Quiero colaborar",
    footerLine: (
      <>
        Built with <strong>Next.js 16</strong>, <strong>Vercel AI SDK</strong>,{" "}
        <strong>Vercel Workflows</strong>, and <strong>Gemini 2.5 Flash</strong>.
        <br />
        Hackathon 2024. Open source. For every child.
      </>
    ),
  },
  en: {
    backToApp: "Back to MIRA",
    heroTitle: "Every child deserves to be seen on time",
    heroLead:
      "MIRA is an accessible, free, bilingual early-detection tool for autism. Built for families, from 18 months on.",
    badgeHack: "Built for the Vercel Hackathon",
    badgeTrack: "Track 1: Workflows",
    ctaApp: "Open MIRA",
    ctaMore: "Learn more",
    sectionWhat: "What is MIRA?",
    cards: [
      {
        title: "Not a diagnosis",
        desc: "MIRA is a screening and orientation tool. No result ever replaces evaluation by a qualified professional.",
      },
      {
        title: "For families",
        desc: "Designed with parents and caregivers in mind. Simple, empathetic interface — no unnecessary medical jargon.",
      },
      {
        title: "Time matters",
        desc: "Early detection opens doors. Early interventions make a real difference in child development.",
      },
    ],
    sectionHow: "How it works",
    steps: [
      {
        title: "1. Conversation",
        desc: "Tell us about your child: age, concerns, family context.",
      },
      {
        title: "2. M-CHAT-R/F",
        desc: "20 scientifically validated questions to detect risk signals.",
      },
      {
        title: "3. Video AI",
        desc: "Optionally upload a short video so Gemini can analyse behaviour objectively.",
      },
      {
        title: "4. Triangulation",
        desc: "We cross-check questionnaire + developmental milestones + video for solid decisions.",
      },
      {
        title: "5. PDF",
        desc: "Professional report ready to bring to your pediatrician or specialist.",
      },
    ],
    agentTitle: "An agent that never forgets a child",
    agentLead: (
      <>
        MIRA uses <strong>Vercel Workflows (WDK)</strong> to become a{" "}
        <em>durable agent</em>. Once screening completes and the PDF is downloaded:
      </>
    ),
    agentBullets: [
      <>
        <strong>It pauses</strong> for 7, 15, 30 or 90 days depending on risk level
      </>,
      <>
        <strong>Automatic retries</strong> if anything fails (with no work on your end)
      </>,
      <>
        <strong>After that window</strong>, it sends a reminder to re-evaluate
      </>,
    ],
    codeBlock: `// Clinically calibrated wait times
HIGH       = 7 days  (high M-CHAT or positive Follow-Up)
MEDIUM     = 15 days (medium M-CHAT)
LOW_DOUBTS = 30 days (triangulation pending)
LOW        = 90 days (routine follow-up)`,
    sectionStack: "Tech Stack",
    sectionBeyondTitle: "Beyond the hackathon",
    sectionBeyondLead:
      "MIRA doesn't end here. It's built to grow. We need:",
    collaborators: [
      "Pediatricians — for clinical validation",
      "Families — your stories matter",
      "Developers — free, open code",
      "NGOs — community reach",
    ],
    ctaCollab: "I want to collaborate",
    footerLine: (
      <>
        Built with <strong>Next.js 16</strong>, <strong>Vercel AI SDK</strong>,{" "}
        <strong>Vercel Workflows</strong>, and <strong>Gemini 2.5 Flash</strong>.
        <br />
        Hackathon 2024. Open source. For every child.
      </>
    ),
  },
} as const

const STAT_ICONS = [Brain, Heart, Zap]
const STEP_ICONS = [MessageCircle, Brain, Zap, CheckCircle2, FileText]

export default function ComoFuncionaPage() {
  // The intake page links here with `?lang=en` when the caregiver is
  // working in English. We honour that as the initial language but
  // still let the visitor flip the toggle freely after landing.
  // We default to "es" on first render (server + first client render)
  // and only adopt the URL-driven value after mount — this avoids
  // hydration mismatches and dodges the Suspense requirement of
  // `useSearchParams()` during static prerender in Next.js 16.
  const [locale, setLocale] = useState<Locale>("es")

  // Read `?lang=en` once, after mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("lang") === "en") setLocale("en")
  }, [])

  // Sync locale to URL so a refresh / share keeps the same view.
  useEffect(() => {
    const url = new URL(window.location.href)
    if (locale === "en") url.searchParams.set("lang", "en")
    else url.searchParams.delete("lang")
    window.history.replaceState({}, "", url.toString())
  }, [locale])

  const t = COPY[locale]
  const homeHref = locale === "en" ? "/?lang=en" : "/"

  return (
    <main className="min-h-dvh w-full bg-background">
      {/* Top chrome — back link + language toggle */}
      <div className="fixed inset-x-0 top-0 z-20 border-b border-border/40 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <a href={homeHref}>
              <ArrowLeft className="size-3.5" />
              {t.backToApp}
            </a>
          </Button>

          {/* Language toggle — same visual language as the IntakeForm
              pill so the user immediately recognises it. */}
          <div
            className="flex items-center gap-1 rounded-full border border-border/60 bg-background/80 p-0.5 text-xs font-medium"
            role="group"
            aria-label="Language"
          >
            <button
              type="button"
              onClick={() => setLocale("es")}
              className={`rounded-full px-3 py-1 transition-colors ${
                locale === "es"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={locale === "es"}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`rounded-full px-3 py-1 transition-colors ${
                locale === "en"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={locale === "en"}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-32 md:pb-32 md:pt-40">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent" />
        <motion.div
          key={`hero-${locale}`}
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="mb-6 font-serif text-4xl font-bold tracking-tight text-balance text-foreground md:text-5xl">
            {t.heroTitle}
          </h1>
          <p className="mb-6 text-lg text-pretty text-muted-foreground">
            {t.heroLead}
          </p>
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <Zap className="size-3" />
              {t.badgeHack}
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              <CheckCircle2 className="size-3" />
              {t.badgeTrack}
            </Badge>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <a href={homeHref}>{t.ctaApp}</a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#como-funciona">{t.ctaMore}</a>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* What is MIRA? */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-foreground">
            {t.sectionWhat}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {t.cards.map((item, i) => {
              const Icon = STAT_ICONS[i]
              return (
                <motion.div
                  key={`${locale}-card-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full border-border/60 bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-sm">
                    <CardHeader>
                      <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/20">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {item.desc}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-foreground">
            {t.sectionHow}
          </h2>
          <div className="space-y-8">
            {t.steps.map((step, i) => {
              const Icon = STEP_ICONS[i]
              return (
                <motion.div
                  key={`${locale}-step-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className="flex gap-6 rounded-lg border border-border/40 bg-card/40 p-4 backdrop-blur-sm transition-colors hover:bg-card/60"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Durable agent */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            key={`agent-${locale}`}
            className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/[0.02] p-8 md:p-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className="mb-6 flex items-center gap-3">
              <Cpu className="size-6 text-primary" />
              <h2 className="font-serif text-2xl font-bold text-foreground">
                {t.agentTitle}
              </h2>
            </div>
            <p className="mb-6 text-muted-foreground">{t.agentLead}</p>
            <ul className="mb-6 space-y-3 text-sm">
              {t.agentBullets.map((bullet, i) => {
                const BulletIcon =
                  i === 0 ? RefreshCw : i === 1 ? CheckCircle2 : Zap
                return (
                  <li key={i} className="flex gap-3">
                    <BulletIcon className="size-4 shrink-0 text-primary" />
                    <span>{bullet}</span>
                  </li>
                )
              })}
            </ul>
            <div className="rounded-lg border border-border/40 bg-card/30 p-4">
              <pre className="overflow-x-auto text-xs text-muted-foreground">
                <code>{t.codeBlock}</code>
              </pre>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-foreground">
            {t.sectionStack}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Next.js 16", desc: locale === "en" ? "App Router, SSR" : "App Router, SSR" },
              { name: "Vercel AI SDK", desc: locale === "en" ? "Streaming, structured output" : "Streaming, salida estructurada" },
              { name: "Vercel WDK", desc: locale === "en" ? "Durable workflows, sleep()" : "Workflows durables, sleep()" },
              { name: "Gemini 2.5 Flash", desc: locale === "en" ? "Vision, tool calling" : "Visión, tool calling" },
              { name: "M-CHAT-R/F", desc: locale === "en" ? "Validated screening" : "Cribado validado" },
              { name: "Framer Motion", desc: locale === "en" ? "Smooth UX" : "UX suave" },
            ].map((tech, i) => (
              <motion.div
                key={`${locale}-tech-${i}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <div className="flex flex-col gap-2 rounded-lg border border-border/40 bg-card/40 p-4 backdrop-blur-sm">
                  <p className="font-semibold text-foreground">{tech.name}</p>
                  <p className="text-xs text-muted-foreground">{tech.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Beyond the hackathon */}
      <section className="relative overflow-hidden px-4 py-16 md:py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            key={`beyond-${locale}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 font-serif text-3xl font-bold text-foreground">
              {t.sectionBeyondTitle}
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              {t.sectionBeyondLead}
            </p>
            <div className="mb-8 grid gap-4 md:grid-cols-2">
              {t.collaborators.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/40 p-3"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
            <Button asChild size="lg" className="gap-2">
              <a href="mailto:gabriel@comunicaciondecalidad.com?subject=Quiero%20colaborar%20con%20MIRA">
                {t.ctaCollab}
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/30 px-4 py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-4xl space-y-3">
          <Button asChild variant="link" size="sm">
            <a href={homeHref}>← {t.backToApp}</a>
          </Button>
          <p>{t.footerLine}</p>
        </div>
      </footer>
    </main>
  )
}
