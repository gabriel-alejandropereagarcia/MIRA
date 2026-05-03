"use client"

import { motion } from "framer-motion"
import {
  AlertTriangle,
  Award,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronRight,
  Cpu,
  FileText,
  Globe,
  Heart,
  Lock,
  MessageCircle,
  RefreshCw,
  Shield,
  Sparkles,
  Video,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
}

export default function ParaElJuradoPage() {
  return (
    <main className="min-h-dvh w-full bg-background">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-20 md:py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/8 via-transparent to-transparent" />
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <Badge className="mb-6 gap-1.5 px-3 py-1 text-xs" variant="secondary">
            <Award className="size-3" />
            Vercel Zero-to-Agent Hackathon · Track: Workflows (WDK)
          </Badge>

          <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            MIRA
          </h1>
          <p className="mb-3 font-serif text-xl text-muted-foreground md:text-2xl">
            Multimodal Interventional Risk Assessment Agent
          </p>
          <p className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground">
            Un agente clínico autónomo que democratiza la detección temprana del
            autismo. Realiza cribados de dos etapas, analiza videos del niño con
            Gemini Vision y genera un informe médico imprimible — todo desde una
            única interfaz de chat.
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {[
              "Next.js App Router",
              "Vercel AI SDK",
              "Vercel Blob",
              "Vercel WDK",
              "Gemini 2.5 Flash",
              "Context Cache",
              "@react-pdf/renderer",
              "Zod",
            ].map((t) => (
              <Badge key={t} variant="outline" className="font-mono text-xs">
                {t}
              </Badge>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── EL PROBLEMA ──────────────────────────────────────────────────── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <motion.div
            className="rounded-xl border border-destructive/20 bg-destructive/5 p-8"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
          >
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="size-6 text-destructive" />
              <h2 className="font-serif text-2xl font-bold text-foreground">
                El Problema
              </h2>
            </div>
            <p className="text-muted-foreground">
              El diagnóstico temprano del Trastorno del Espectro Autista (TEA)
              puede cambiar radicalmente la trayectoria del desarrollo de un niño.
              Sin embargo, los padres en la mayor parte del mundo enfrentan listas
              de espera de meses y carecen de herramientas de cribado accesibles.
              Un padre preocupado hoy no tiene un primer paso claro, seguro y
              gratuito.
            </p>
            <p className="mt-3 font-semibold text-foreground">
              MIRA es ese primer paso.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── ARQUITECTURA COMPLETA ─────────────────────────────────────────── */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <motion.h2
            className="mb-4 text-center font-serif text-3xl font-bold text-foreground"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
          >
            Arquitectura completa del agente
          </motion.h2>
          <motion.p
            className="mb-12 text-center text-muted-foreground"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
          >
            8 capacidades, 7 herramientas (<em>tool calls</em>), 3 productos de
            Vercel
          </motion.p>

          <div className="space-y-6">
            {[
              {
                num: "01",
                icon: Brain,
                title: "Intake + Triangulación CDC (anti-falso-negativo)",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20",
                desc: (
                  <>
                    Antes de cualquier cuestionario, MIRA recopila el perfil del
                    niño y lo cruza con la base de datos de{" "}
                    <strong>Hitos de Desarrollo CDC "Learn the Signs. Act Early."</strong>{" "}
                    integrada en <code>milestones-data.ts</code>. Cada hito no
                    observado se inyecta en el system prompt como señal de
                    triangulación: incluso si el M-CHAT puntúa bajo, el agente
                    detecta banderas rojas pendientes y ajusta su postura clínica
                    de forma independiente.
                  </>
                ),
              },
              {
                num: "02",
                icon: MessageCircle,
                title: "Generative UI dinámica — M-CHAT-R/F Etapa 1",
                color: "text-violet-500",
                bg: "bg-violet-500/10",
                border: "border-violet-500/20",
                desc: (
                  <>
                    MIRA nunca recita las 20 preguntas en texto. Llama a{" "}
                    <code>iniciar_cuestionario_mchat</code> para{" "}
                    <strong>
                      transmitir en streaming un componente React interactivo
                    </strong>{" "}
                    directamente en el chat. Las respuestas vuelven al servidor y{" "}
                    <code>evaluar_riesgo_mchat</code> calcula el puntaje con una
                    función determinista validada con Zod — el LLM nunca toca la
                    aritmética.
                  </>
                ),
              },
              {
                num: "03",
                icon: RefreshCw,
                title: "Follow-Up automático de Etapa 2 (reducción de falsos positivos)",
                color: "text-amber-500",
                bg: "bg-amber-500/10",
                border: "border-amber-500/20",
                desc: (
                  <>
                    Si Etapa 1 devuelve{" "}
                    <strong>riesgo Medio (3–7 puntos)</strong>, el agente invoca
                    autónomamente <code>iniciar_followup_mchat</code>, renderizando
                    un segundo componente interactivo con preguntas de
                    aclaración ítem-a-ítem. Los resultados alimentan{" "}
                    <code>evaluar_followup_mchat</code> en el servidor. Este
                    protocolo de dos etapas espeja el flujo clínico validado y
                    está ausente en todas las demás herramientas de cribado con IA.
                  </>
                ),
              },
              {
                num: "04",
                icon: Video,
                title: "Análisis de video con Gemini Vision (Multimodal)",
                color: "text-rose-500",
                bg: "bg-rose-500/10",
                border: "border-rose-500/20",
                desc: (
                  <>
                    El agente llama a la herramienta unificada <code>analizar_video</code>,
                    que renderiza un uploader en el cliente. El padre sube un video
                    casero breve. El archivo se almacena en{" "}
                    <strong>Vercel Blob</strong>, luego se envía a la{" "}
                    <strong>Gemini File API</strong>. Gemini 2.5 Flash Vision analiza
                    cuatro marcadores clínicos (contacto visual, respuesta al nombre,
                    aleteo de manos, señalamiento) y devuelve JSON estructurado que
                    MIRA interpreta empáticamente para la familia. Toda la cadena
                    (render → upload → analizar → responder) es determinista y
                    controlada por el cliente — el LLM no puede quedarse atascado
                    entre pasos.
                  </>
                ),
              },
              {
                num: "05",
                icon: FileText,
                title: "Informe médico PDF imprimible",
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
                border: "border-emerald-500/20",
                desc: (
                  <>
                    La herramienta <code>generar_informe_pediatra</code> activa{" "}
                    <code>@react-pdf/renderer</code> en el cliente para compilar
                    la sesión completa (perfil del niño, puntaje Etapa 1,
                    resultados Follow-Up, hallazgos de video, recomendaciones ESDM)
                    en un <strong>PDF médico profesional</strong> que los padres
                    pueden imprimir y llevar al pediatra. El informe sigue estándares
                    de formato clínico y cita explícitamente la autoría del
                    M-CHAT-R/F™.
                  </>
                ),
              },
              {
                num: "06",
                icon: Sparkles,
                title: "Intervenciones de juego ESDM (Early Start Denver Model)",
                color: "text-cyan-500",
                bg: "bg-cyan-500/10",
                border: "border-cyan-500/20",
                desc: (
                  <>
                    Ante cualquier detección de riesgo medio o alto, MIRA llama a{" "}
                    <code>sugerir_ejercicios_denver</code> para entregar rutinas
                    de juego estructuradas y basadas en evidencia en 4 dominios del
                    desarrollo (imitación, comunicación no verbal, juego simbólico,
                    atención conjunta) adaptadas a la edad en meses y contexto
                    cotidiano del niño.
                  </>
                ),
              },
              {
                num: "07",
                icon: Cpu,
                title: "Follow-ups durables y asíncronos — Track WDK",
                color: "text-primary",
                bg: "bg-primary/10",
                border: "border-primary/20",
                desc: (
                  <>
                    Una vez entregado el PDF, el frontend dispara un POST a{" "}
                    <code>/api/workflows/followup</code>, que llama a{" "}
                    <code>start(miraFollowUpWorkflow)</code> usando el{" "}
                    <strong>Vercel Workflow Development Kit</strong>. El workflow
                    usa <code>sleep()</code> para pausarse durablemente según
                    urgencia clínica:{" "}
                    <strong>
                      ALTO → 7 días · MEDIO → 15 días · BAJO_DUDAS → 30 días ·
                      BAJO → 90 días
                    </strong>
                    . Esto convierte a MIRA de una herramienta de un solo disparo
                    en un <strong>agente durable de larga duración</strong> que
                    sigue acompañando a las familias sin consumir cómputo durante
                    el sleep.
                  </>
                ),
              },
              {
                num: "08",
                icon: BarChart3,
                title: "Gemini Context Cache (optimización de costo)",
                color: "text-orange-500",
                bg: "bg-orange-500/10",
                border: "border-orange-500/20",
                desc: (
                  <>
                    Toda la base de conocimiento clínico (tabla M-CHAT-R/F,
                    protocolos ESDM, semántica de herramientas) vive en{" "}
                    <code>mira-static-knowledge.ts</code> y se sube a la{" "}
                    <strong>CachedContent API de Google</strong> en cold start
                    con TTL de 1 hora. Cada request posterior reutiliza el caché —
                    el bloque estático pesado nunca re-entra en la ventana de
                    contexto, manteniendo el costo por turno mínimo (~25% del
                    precio normal de tokens de entrada).
                  </>
                ),
              },
            ].map((item, i) => (
              <motion.div
                key={item.num}
                custom={i}
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                viewport={{ once: true, margin: "-60px" }}
                className={`rounded-xl border ${item.border} bg-card/40 p-6 backdrop-blur-sm`}
              >
                <div className="flex gap-5">
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${item.bg}`}
                    >
                      <item.icon className={`size-5 ${item.color}`} />
                    </div>
                    <span className={`font-mono text-xs font-bold ${item.color} opacity-60`}>
                      {item.num}
                    </span>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GUARDIA CLÍNICA ───────────────────────────────────────────────── */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <motion.div
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-7"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
          >
            <div className="mb-3 flex items-center gap-3">
              <Shield className="size-5 text-destructive" />
              <h3 className="font-semibold text-foreground">
                Guardia clínica — Regla de Interrupción por Regresión
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Si un padre menciona <em>pérdida de habilidades previamente adquiridas</em>{" "}
              ("dejó de hablar", "ya no hace contacto visual"), el agente{" "}
              <strong>abandona inmediatamente el cuestionario</strong> y emite una
              derivación urgente a neuropediatría. Ninguna otra herramienta de
              cribado con IA implementa esta regla, crítica para descartar
              condiciones neurológicas como el síndrome de Landau-Kleffner.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── 3 PRODUCTOS VERCEL ───────────────────────────────────────────── */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            className="mb-10 text-center font-serif text-3xl font-bold text-foreground"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
          >
            3 productos de Vercel, 1 agente
          </motion.h2>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Zap,
                product: "Vercel AI SDK",
                role: "Orquestación + streaming",
                detail:
                  "streamText con tool calling, generative UI en streaming, validación Zod de todos los I/O de herramientas.",
              },
              {
                icon: Lock,
                product: "Vercel Blob",
                role: "Almacenamiento de video",
                detail:
                  "Upload directo desde el cliente con token efímero. Almacena los videos del niño de forma segura antes de enviarlos a la Gemini File API.",
              },
              {
                icon: Cpu,
                product: "Vercel WDK",
                role: "Agente durable",
                detail:
                  "sleep() pausa el agente 7–90 días sin consumir cómputo. El endpoint /api/workflows/followup es fire-and-forget y devuelve un runId inmediatamente.",
              },
            ].map((v, i) => (
              <motion.div
                key={v.product}
                custom={i}
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                viewport={{ once: true }}
              >
                <Card className="h-full border-primary/20 bg-gradient-to-br from-primary/8 to-transparent">
                  <CardHeader className="pb-3">
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/15">
                      <v.icon className="size-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{v.product}</CardTitle>
                    <p className="text-xs font-medium text-primary">{v.role}</p>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {v.detail}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DESAFÍOS ─────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            className="mb-10 text-center font-serif text-3xl font-bold text-foreground"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
          >
            Desafíos técnicos resueltos
          </motion.h2>
          <div className="space-y-5">
            {[
              {
                title: "LLM vs. Medicina Determinista",
                body: "Los LLMs quieren razonar libremente; el scoring clínico es binario y no negociable. Solución: el LLM es un puro orquestador y capa de empatía, mientras todo el scoring, branching y clasificación de riesgo corre en funciones execute tipadas con esquemas Zod — el modelo nunca puede influir en la salida numérica.",
              },
              {
                title: "Encadenamiento multimodal confiable",
                body: "Lograr que el agente encadene de forma confiable \"render uploader → esperar → analizar → responder\" requirió colapsar lo que originalmente eran dos herramientas en una herramienta unificada analizar_video. El cliente posee toda la pipeline de upload+análisis y devuelve un objeto resultado completo, por lo que el modelo nunca queda esperando entre pasos.",
              },
              {
                title: "Estado durable en serverless",
                body: "El sleep() del WDK necesitó integración cuidadosa con el App Router de Next.js. El endpoint /api/workflows/followup es fire-and-forget: llama a start() y devuelve un runId inmediatamente, asegurando que el hilo principal nunca se bloquee.",
              },
            ].map((c, i) => (
              <motion.div
                key={c.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                viewport={{ once: true }}
                className="flex gap-4 rounded-lg border border-border/50 bg-card/40 p-5"
              >
                <ChevronRight className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="mb-1 font-semibold text-foreground">{c.title}</p>
                  <p className="text-sm text-muted-foreground">{c.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LO QUE NOS ENORGULLECE ───────────────────────────────────────── */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/6 to-transparent p-8 md:p-12"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
          >
            <div className="mb-5 flex items-center gap-3">
              <Heart className="size-6 text-primary" />
              <h2 className="font-serif text-2xl font-bold text-foreground">
                Lo que nos enorgullece
              </h2>
            </div>
            <p className="text-muted-foreground">
              MIRA hace algo que la mayoría de las "herramientas de salud con IA"
              evitan: es simultáneamente{" "}
              <strong>cálida y rigurosa</strong>. Un padre se siente escuchado por
              un compañero conversacional compasivo; debajo, una máquina de estados
              clínica determinista garantiza que ningún nivel de riesgo se calcule
              mal, ningún falso positivo pase sin una verificación de Etapa 2, y
              ninguna familia se vaya sin un documento físico para llevar al médico.
            </p>
            <p className="mt-4 text-muted-foreground">
              La arquitectura abarca tres productos de Vercel:{" "}
              <strong>AI SDK</strong> (orquestación + streaming),{" "}
              <strong>Blob</strong> (almacenamiento de video) y{" "}
              <strong>Workflows WDK</strong> (agentes durables asíncronos) — el
              corazón del track de la submission.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── TECH STACK ───────────────────────────────────────────────────── */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            className="mb-10 text-center font-serif text-3xl font-bold text-foreground"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
          >
            Stack tecnológico
          </motion.h2>
          <motion.div
            className="overflow-hidden rounded-xl border border-border/50"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="px-5 py-3 text-left font-semibold text-foreground">
                    Capa
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-foreground">
                    Tecnología
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Framework", "Next.js 16 (App Router)"],
                  ["Orquestación IA", "Vercel AI SDK (ai, @ai-sdk/google)"],
                  ["LLM / Visión", "Google Gemini 2.5 Flash"],
                  ["Context Cache", "Gemini CachedContent API"],
                  ["Almacenamiento de Video", "Vercel Blob (@vercel/blob)"],
                  ["Agente Durable", "Vercel WDK (workflow, @workflow/next)"],
                  ["UI / Componentes", "v0, Radix UI, Tailwind CSS, Framer Motion"],
                  ["Generación de PDF", "@react-pdf/renderer (client-side)"],
                  ["Validación", "Zod (todos los esquemas I/O de herramientas)"],
                  ["Analytics", "Vercel Analytics"],
                ].map(([layer, tech], i) => (
                  <tr
                    key={layer}
                    className={`border-b border-border/30 transition-colors hover:bg-muted/20 ${
                      i % 2 === 0 ? "" : "bg-muted/10"
                    }`}
                  >
                    <td className="px-5 py-3 font-medium text-foreground">
                      {layer}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {tech}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ── QUÉ SIGUE ────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            className="mb-10 text-center font-serif text-3xl font-bold text-foreground"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
          >
            Hoja de ruta
          </motion.h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Globe,
                text: "Conectar el workflow durable a endpoints de notificación reales (Resend para email, Twilio para SMS).",
              },
              {
                icon: Brain,
                text: "Agregar ADOS-2 y CARS-2 como esquemas de herramientas modulares plug-and-play.",
              },
              {
                icon: Heart,
                text: "Localización a portugués, francés y árabe para llegar a comunidades desatendidas globalmente.",
              },
              {
                icon: Sparkles,
                text: "Asociarse con redes pediátricas en América Latina para validación clínica formal.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                viewport={{ once: true }}
                className="flex gap-4 rounded-lg border border-border/40 bg-card/40 p-5"
              >
                <item.icon className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={fadeUp}
          viewport={{ once: true }}
        >
          <p className="mb-6 text-muted-foreground">
            Gracias por explorar MIRA. Toda la arquitectura está visible en el
            código fuente y desplegada en Vercel.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <a href="/">Abrir MIRA</a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="/como-funciona">¿Cómo funciona?</a>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <a href="/jury">English version →</a>
            </Button>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
