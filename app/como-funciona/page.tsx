"use client"

import { motion } from "framer-motion"
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Code2,
  Cpu,
  Heart,
  MessageCircle,
  RefreshCw,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ComoFuncionaPage() {
  return (
    <main className="min-h-dvh w-full bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 md:py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent" />
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="mb-6 font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Cada niño merece ser visto a tiempo
          </h1>
          <p className="mb-6 text-lg text-muted-foreground">
            MIRA es una herramienta de detección temprana del autismo, accesible,
            gratis y bilingüe. Pensada para familias, desde los 18 meses.
          </p>
          <div className="mb-8 flex justify-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <Zap className="size-3" />
              Built for the Vercel Hackathon
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              <CheckCircle2 className="size-3" />
              Track 1: Workflows
            </Badge>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <a href="/">Ir a MIRA</a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#como-funciona">Conoce más</a>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ¿Qué es MIRA? */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-foreground">
            ¿Qué es MIRA?
          </h2>
          <motion.div
            className="grid gap-6 md:grid-cols-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.4, staggerChildren: 0.1 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              {
                icon: Brain,
                title: "No es diagnóstico",
                desc: "MIRA es una herramienta de cribado y orientación. Ningún resultado reemplaza la evaluación de un profesional calificado.",
              },
              {
                icon: Heart,
                title: "Para las familias",
                desc: "Diseñada pensando en padres y cuidadores. Interfaz simple, empática, sin jerga médica innecesaria.",
              },
              {
                icon: Zap,
                title: "El tiempo importa",
                desc: "La detección temprana abre puertas. Intervenciones tempranas marcan la diferencia en el desarrollo infantil.",
              },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }} viewport={{ once: true }}>
                <Card className="h-full border-border/60 bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-sm">
                  <CardHeader>
                    <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/20">
                      <item.icon className="size-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {item.desc}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-foreground">
            Cómo funciona
          </h2>
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.4, staggerChildren: 0.05 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              {
                icon: MessageCircle,
                title: "1. Conversación",
                desc: "Cuéntanos sobre tu hijo/a: edad, preocupaciones, contexto familiar.",
              },
              {
                icon: Brain,
                title: "2. M-CHAT-R/F",
                desc: "20 preguntas validadas científicamente para detectar señales de riesgo.",
              },
              {
                icon: Zap,
                title: "3. Video IA",
                desc: "Opcionalmente, sube un video corto para que Gemini analice conductas objetivamente.",
              },
              {
                icon: CheckCircle2,
                title: "4. Triangulación",
                desc: "Cruzamos cuestionario + hitos del desarrollo + video para decisiones sólidas.",
              },
              {
                icon: FileText,
                title: "5. PDF",
                desc: "Informe profesional listo para llevar al pediatra o especialista.",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                viewport={{ once: true }}
                className="flex gap-6 rounded-lg border border-border/40 bg-card/40 p-4 backdrop-blur-sm transition-colors hover:bg-card/60"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <step.icon className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* El Agente Durable */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/[0.02] p-8 md:p-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className="mb-6 flex items-center gap-3">
              <Cpu className="size-6 text-primary" />
              <h2 className="font-serif text-2xl font-bold text-foreground">
                Un agente que no se olvida de ningún niño
              </h2>
            </div>
            <p className="mb-6 text-muted-foreground">
              MIRA usa <strong>Vercel Workflows (WDK)</strong> para convertirse en
              un <em>agente durable</em>. Una vez termina el screening y el PDF
              se descarga:
            </p>
            <ul className="mb-6 space-y-3 text-sm">
              <li className="flex gap-3">
                <RefreshCw className="size-4 shrink-0 text-primary" />
                <span>
                  <strong>Se pausa</strong> por 7, 15, 30 o 90 días según nivel de
                  riesgo
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                <span>
                  <strong>Reintentos automáticos</strong> si algo falla (sin tu
                  intervención)
                </span>
              </li>
              <li className="flex gap-3">
                <Zap className="size-4 shrink-0 text-primary" />
                <span>
                  <strong>Después del tiempo</strong>, envía un recordatorio para
                  reevaluación
                </span>
              </li>
            </ul>
            <div className="rounded-lg border border-border/40 bg-card/30 p-4">
              <code className="text-xs text-muted-foreground">
                {`// Tiempos clínicos calibrados
ALTO = 7 días (M-CHAT alto o Follow-Up positivo)
MEDIO = 15 días (M-CHAT medio)
BAJO_DUDAS = 30 días (Triangulación pendiente)
BAJO = 90 días (Seguimiento rutinario)`}
              </code>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stack Tecnológico */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-foreground">
            Stack Tecnológico
          </h2>
          <motion.div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.4, staggerChildren: 0.05 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              { name: "Next.js 16", desc: "App Router, SSR" },
              { name: "Vercel AI SDK", desc: "Streaming, structured output" },
              { name: "Vercel WDK", desc: "Durable workflows, sleep()" },
              { name: "Gemini 2.5 Flash", desc: "Vision, tool calling" },
              { name: "M-CHAT-R/F", desc: "Screening validado" },
              { name: "Framer Motion", desc: "Smooth UX" },
            ].map((tech, i) => (
              <motion.div 
                key={i}
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
          </motion.div>
        </div>
      </section>

      {/* Más allá del hackathon */}
      <section className="relative overflow-hidden px-4 py-16 md:py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 font-serif text-3xl font-bold text-foreground">
              Más allá del hackathon
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              MIRA no termina aquí. Está diseñada para crecer. Necesitamos:
            </p>
            <div className="mb-8 grid gap-4 md:grid-cols-2">
              {[
                "Pediatras — para validación clínica",
                "Familias — tus historias importan",
                "Desarrolladores — código libre",
                "ONGs — alcance en comunidades",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/40 p-3"
                >
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
            <Button
              asChild
              size="lg"
              className="gap-2"
            >
              <a href="mailto:gabriel@comunicaciondecalidad.com?subject=Quiero%20colaborar%20con%20MIRA">
                Quiero colaborar
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
            <a href="/">← Volver a MIRA</a>
          </Button>
          <p>
            Built with <strong>Next.js 16</strong>, <strong>Vercel AI SDK</strong>,{" "}
            <strong>Vercel Workflows</strong>, and <strong>Gemini 2.5 Flash</strong>.
            <br />
            Hackathon 2024. Open source. For every child.
          </p>
        </div>
      </footer>
    </main>
  )
}

// For FileText icon used in the pipeline
import { FileText } from "lucide-react"
