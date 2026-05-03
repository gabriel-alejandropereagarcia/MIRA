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

export default function ForTheJuryPage() {
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
            An empathetic, durable AI agent that democratizes early autism
            detection. It autonomously conducts two-stage clinical screenings,
            analyzes child behavior in real-world videos using Gemini Vision, and
            generates a printable medical report — all from a single chat
            interface.
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

      {/* ── THE PROBLEM ──────────────────────────────────────────────────── */}
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
                The Problem
              </h2>
            </div>
            <p className="text-muted-foreground">
              Early diagnosis of Autism Spectrum Disorder (ASD) can drastically
              change a child's developmental trajectory. Yet parents in most of
              the world face months-long waitlists and lack of accessible
              screening tools. A worried parent today has no clear, safe, and
              free first step.
            </p>
            <p className="mt-3 font-semibold text-foreground">
              MIRA is that first step.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FULL ARCHITECTURE ────────────────────────────────────────────── */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <motion.h2
            className="mb-4 text-center font-serif text-3xl font-bold text-foreground"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
          >
            Full Agent Architecture
          </motion.h2>
          <motion.p
            className="mb-12 text-center text-muted-foreground"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
          >
            8 capabilities, 7 tools (tool calls), 3 Vercel products
          </motion.p>

          <div className="space-y-6">
            {[
              {
                num: "01",
                icon: Brain,
                title: "Intake & CDC Milestone Triangulation (anti-false-negative)",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20",
                desc: (
                  <>
                    Before any questionnaire, MIRA collects the child's profile
                    and cross-references it against the built-in{" "}
                    <strong>
                      CDC "Learn the Signs. Act Early." Red Flag Milestone
                      database
                    </strong>{" "}
                    in <code>milestones-data.ts</code>. Any unobserved milestone
                    is injected into the live system prompt as a triangulation
                    signal — so even if the M-CHAT score comes back low, the
                    agent notices pending red flags and adjusts its clinical
                    stance independently.
                  </>
                ),
              },
              {
                num: "02",
                icon: MessageCircle,
                title: "Dynamic Generative UI — M-CHAT-R/F Stage 1",
                color: "text-violet-500",
                bg: "bg-violet-500/10",
                border: "border-violet-500/20",
                desc: (
                  <>
                    MIRA never recites the 20 questions in text. It calls{" "}
                    <code>iniciar_cuestionario_mchat</code> to{" "}
                    <strong>
                      stream a fully interactive React questionnaire component
                    </strong>{" "}
                    directly into the chat. Responses flow back to the server
                    and <code>evaluar_riesgo_mchat</code> calculates the score
                    with a deterministic Zod-validated function — the LLM never
                    touches the arithmetic.
                  </>
                ),
              },
              {
                num: "03",
                icon: RefreshCw,
                title: "Automatic Stage 2 Follow-Up (reducing false positives)",
                color: "text-amber-500",
                bg: "bg-amber-500/10",
                border: "border-amber-500/20",
                desc: (
                  <>
                    If Stage 1 returns a{" "}
                    <strong>Medium risk (3–7 points)</strong>, the agent
                    autonomously invokes <code>iniciar_followup_mchat</code>,
                    rendering a second interactive component with item-specific
                    clarification questions. Results feed{" "}
                    <code>evaluar_followup_mchat</code> server-side. This
                    two-stage protocol mirrors the validated clinical workflow
                    and is absent in every other AI screening tool.
                  </>
                ),
              },
              {
                num: "04",
                icon: Video,
                title: "Gemini Vision Video Analysis (Multimodal)",
                color: "text-rose-500",
                bg: "bg-rose-500/10",
                border: "border-rose-500/20",
                desc: (
                  <>
                    The agent calls the unified <code>analizar_video</code>{" "}
                    tool, which renders a video uploader client-side. The parent
                    uploads a short home video. The file is stored via{" "}
                    <strong>Vercel Blob</strong>, then sent to the{" "}
                    <strong>Gemini File API</strong>. Gemini 2.5 Flash Vision
                    analyzes four clinical behavioral markers (eye contact,
                    response to name, hand-flapping, pointing) and returns
                    structured JSON that MIRA interprets empathetically for the
                    family. The entire chain (render → upload → analyze →
                    respond) is deterministic and controlled by the client — the
                    LLM cannot get stuck between steps.
                  </>
                ),
              },
              {
                num: "05",
                icon: FileText,
                title: "Printable Medical PDF Report",
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
                border: "border-emerald-500/20",
                desc: (
                  <>
                    The <code>generar_informe_pediatra</code> tool triggers{" "}
                    <code>@react-pdf/renderer</code> client-side to compile the
                    full session (child profile, Stage 1 score, Follow-Up
                    results, video findings, ESDM recommendations) into a{" "}
                    <strong>professional medical PDF</strong> parents can print
                    and bring to their pediatrician. The report follows clinical
                    formatting standards and explicitly cites M-CHAT-R/F™
                    authorship.
                  </>
                ),
              },
              {
                num: "06",
                icon: Sparkles,
                title: "ESDM Play Interventions (Early Start Denver Model)",
                color: "text-cyan-500",
                bg: "bg-cyan-500/10",
                border: "border-cyan-500/20",
                desc: (
                  <>
                    After any medium or high-risk detection, MIRA calls{" "}
                    <code>sugerir_ejercicios_denver</code> to deliver structured,
                    evidence-based play routines across 4 developmental domains
                    (imitation, non-verbal communication, symbolic play, joint
                    attention) adapted to the child's age in months and daily
                    context.
                  </>
                ),
              },
              {
                num: "07",
                icon: Cpu,
                title: "Durable Asynchronous Follow-ups — WDK Track",
                color: "text-primary",
                bg: "bg-primary/10",
                border: "border-primary/20",
                desc: (
                  <>
                    Once the PDF is delivered, the frontend fires a POST to{" "}
                    <code>/api/workflows/followup</code>, which calls{" "}
                    <code>start(miraFollowUpWorkflow)</code> using the{" "}
                    <strong>Vercel Workflow Development Kit</strong>. The
                    workflow uses <code>sleep()</code> to pause durably based on
                    clinical urgency:{" "}
                    <strong>
                      HIGH → 7 days · MEDIUM → 15 days · LOW_CONCERNS → 30
                      days · LOW → 90 days
                    </strong>
                    . This converts MIRA from a one-shot tool into a{" "}
                    <strong>long-running durable agent</strong> that keeps
                    caring for families without consuming any compute during the
                    sleep.
                  </>
                ),
              },
              {
                num: "08",
                icon: BarChart3,
                title: "Gemini Context Cache (cost optimization)",
                color: "text-orange-500",
                bg: "bg-orange-500/10",
                border: "border-orange-500/20",
                desc: (
                  <>
                    The entire clinical knowledge base (M-CHAT-R/F table, ESDM
                    protocols, tool semantics) lives in{" "}
                    <code>mira-static-knowledge.ts</code> and is uploaded to
                    Google's <strong>CachedContent API</strong> on cold start
                    with a 1-hour TTL. Every subsequent request reuses the cache
                    — the heavy static block never re-enters the context window,
                    keeping per-turn token costs minimal (~25% of normal input
                    token price).
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
                    <span
                      className={`font-mono text-xs font-bold ${item.color} opacity-60`}
                    >
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

      {/* ── CLINICAL GUARDRAIL ───────────────────────────────────────────── */}
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
                Clinical Guardrail — Regression Interruption Rule
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              If a parent mentions{" "}
              <em>loss of previously acquired skills</em> ("stopped talking",
              "no longer makes eye contact"), the agent{" "}
              <strong>immediately abandons the questionnaire</strong> and issues
              an urgent neuropediatric referral. No other AI screening tool
              implements this rule, which is critical for ruling out neurological
              conditions such as Landau-Kleffner syndrome.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── 3 VERCEL PRODUCTS ────────────────────────────────────────────── */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            className="mb-10 text-center font-serif text-3xl font-bold text-foreground"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
          >
            3 Vercel Products, 1 Agent
          </motion.h2>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Zap,
                product: "Vercel AI SDK",
                role: "Orchestration + streaming",
                detail:
                  "streamText with tool calling, generative UI streaming, Zod validation on all tool I/O schemas.",
              },
              {
                icon: Lock,
                product: "Vercel Blob",
                role: "Video storage",
                detail:
                  "Direct client upload with ephemeral token. Securely stores child videos before forwarding to the Gemini File API.",
              },
              {
                icon: Cpu,
                product: "Vercel WDK",
                role: "Durable agent",
                detail:
                  "sleep() pauses the agent 7–90 days with zero compute. The /api/workflows/followup endpoint is fire-and-forget and returns a runId immediately.",
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

      {/* ── CHALLENGES ───────────────────────────────────────────────────── */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            className="mb-10 text-center font-serif text-3xl font-bold text-foreground"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
          >
            Technical Challenges Solved
          </motion.h2>
          <div className="space-y-5">
            {[
              {
                title: "LLM vs. Deterministic Medicine",
                body: "LLMs want to reason freely; clinical scoring is binary and non-negotiable. Solution: the LLM is a pure orchestrator and empathy layer, while all scoring, branching, and risk classification runs in typed execute functions with Zod schemas — the model can never influence the numerical output.",
              },
              {
                title: "Reliable Multimodal Chaining",
                body: 'Getting the agent to reliably chain "render uploader → wait → analyze → respond" required collapsing what was originally two tools into one unified analizar_video tool. The client owns the full upload+analyze pipeline and returns a complete result object, so the model is never left waiting between steps.',
              },
              {
                title: "Durable State across Serverless",
                body: "The WDK sleep() needed careful integration with the Next.js App Router. The /api/workflows/followup endpoint is fire-and-forget — it calls start() and returns a runId immediately, ensuring the main thread never blocks.",
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

      {/* ── WHAT WE'RE PROUD OF ──────────────────────────────────────────── */}
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
                What We're Proud Of
              </h2>
            </div>
            <p className="text-muted-foreground">
              MIRA does something most "AI health tools" avoid: it is
              simultaneously{" "}
              <strong>warm and rigorous</strong>. A parent feels heard by a
              compassionate conversational partner; underneath, a deterministic
              clinical state machine ensures no risk level gets miscalculated,
              no false positive makes it through without a Stage 2 check, and no
              family leaves without a physical document they can put in their
              doctor's hands.
            </p>
            <p className="mt-4 text-muted-foreground">
              The agent's architecture spans three Vercel products:{" "}
              <strong>AI SDK</strong> (orchestration + streaming),{" "}
              <strong>Blob</strong> (video storage), and{" "}
              <strong>Workflows WDK</strong> (durable async agents) — the core
              of the submission track.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── TECH STACK TABLE ─────────────────────────────────────────────── */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            className="mb-10 text-center font-serif text-3xl font-bold text-foreground"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
          >
            Tech Stack
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
                    Layer
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-foreground">
                    Technology
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Framework", "Next.js 16 (App Router)"],
                  ["AI Orchestration", "Vercel AI SDK (ai, @ai-sdk/google)"],
                  ["LLM / Vision", "Google Gemini 2.5 Flash"],
                  ["Context Cache", "Gemini CachedContent API"],
                  ["Video Storage", "Vercel Blob (@vercel/blob)"],
                  ["Durable Agent", "Vercel WDK (workflow, @workflow/next)"],
                  ["UI / Components", "v0, Radix UI, Tailwind CSS, Framer Motion"],
                  ["PDF Generation", "@react-pdf/renderer (client-side)"],
                  ["Validation", "Zod (all tool I/O schemas)"],
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

      {/* ── ROADMAP ──────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            className="mb-10 text-center font-serif text-3xl font-bold text-foreground"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
          >
            Roadmap
          </motion.h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Globe,
                text: "Connect the durable workflow to real notification endpoints (Resend for email, Twilio for SMS).",
              },
              {
                icon: Brain,
                text: "Add ADOS-2 and CARS-2 as modular plug-and-play tool schemas.",
              },
              {
                icon: Heart,
                text: "Localize to Portuguese, French, and Arabic to reach underserved communities globally.",
              },
              {
                icon: Sparkles,
                text: "Partner with pediatric networks in Latin America for formal clinical validation.",
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
            Thanks for exploring MIRA. The full architecture is visible in the
            source code and deployed on Vercel.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <a href="/">Open MIRA</a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="/como-funciona?lang=en">How it works</a>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <a href="/jurado">← Versión en español</a>
            </Button>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
