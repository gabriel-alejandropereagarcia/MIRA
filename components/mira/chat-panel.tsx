"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowUp, Heart, PanelLeft, Sparkles } from "lucide-react"
import type { MiraUIMessage } from "@/app/api/chat/route"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { RiskMeter } from "@/components/generative/risk-meter"
import { DenverCards } from "@/components/generative/denver-cards"
import { VideoUploader } from "@/components/generative/video-uploader"
import { VideoAnalysisCard } from "@/components/generative/video-analysis-card"
import { MchatQuestionnaire } from "@/components/generative/mchat-questionnaire"
import type { TriageState } from "@/components/mira/triage-sidebar"
import { MessageText } from "@/components/mira/message-text"

type Props = {
  onStateChange: (state: TriageState) => void
  onToggleSidebar: () => void
}

const SUGGESTIONS = [
  "Mi hijo de 20 meses no señala con el dedo aún.",
  "Aplicar el cuestionario M-CHAT a mi hija de 22 meses.",
  "¿Qué ejercicios Denver ayudan con la atención conjunta?",
]

export function ChatPanel({ onStateChange, onToggleSidebar }: Props) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    sendMessage,
    addToolOutput,
    status,
    stop,
  } = useChat<MiraUIMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  })

  // Derive triage state from the message history
  const triageState = useMemo<TriageState>(() => {
    const state: TriageState = {
      intake: messages.some((m) => m.role === "user"),
      mchat: false,
      risk: null,
      denver: false,
      video: false,
    }
    for (const m of messages) {
      for (const p of m.parts ?? []) {
        if (p.type === "tool-evaluar_riesgo_mchat" && p.state === "output-available") {
          state.mchat = true
          const out = p.output as { riesgo: "bajo" | "medio" | "alto" }
          state.risk = out.riesgo
        }
        if (p.type === "tool-sugerir_ejercicios_denver" && p.state === "output-available") {
          state.denver = true
        }
        if (p.type === "tool-analizar_video_conducta" && p.state === "output-available") {
          state.video = true
        }
      }
    }
    return state
  }, [messages])

  useEffect(() => {
    onStateChange(triageState)
  }, [triageState, onStateChange])

  // Autoscroll
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [messages, status])

  const isBusy = status === "streaming" || status === "submitted"
  const hasMessages = messages.length > 0

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isBusy) return
    sendMessage({ text })
    setInput("")
  }

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur md:px-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onToggleSidebar}
            aria-label="Abrir panel lateral"
          >
            <PanelLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary md:hidden">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">
                Asistente MIRA
              </p>
              <p className="text-[11px] text-muted-foreground">
                Cribado empático · Protocolos M-CHAT-R/F + ESDM
              </p>
            </div>
          </div>
        </div>
        <Badge
          variant="outline"
          className="hidden gap-1.5 border-primary/30 bg-primary/5 text-primary sm:flex"
        >
          <Heart className="size-3 fill-primary/30" />
          Cribado, no diagnóstico
        </Badge>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="mira-scroll flex-1 overflow-y-auto px-4 py-6 md:px-8"
      >
        <div className="mx-auto w-full max-w-3xl space-y-5">
          {!hasMessages && <WelcomeCard onPick={(t) => setInput(t)} />}

          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "flex gap-3",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {m.role === "assistant" && <AssistantAvatar />}

                <div
                  className={cn(
                    "flex max-w-[85%] flex-col gap-2",
                    m.role === "user" && "items-end",
                  )}
                >
                  {m.parts.map((part, i) => {
                    // --- TEXT ---
                    if (part.type === "text") {
                      return (
                        <div
                          key={i}
                          className={cn(
                            "rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed shadow-sm",
                            m.role === "user"
                              ? "rounded-br-sm bg-primary text-primary-foreground"
                              : "rounded-bl-sm bg-card text-foreground ring-1 ring-border/60",
                          )}
                        >
                          <MessageText
                            text={part.text}
                            muted={m.role === "user"}
                          />
                        </div>
                      )
                    }

                    // --- TOOL: iniciar_cuestionario_mchat (client-side UI) ---
                    if (part.type === "tool-iniciar_cuestionario_mchat") {
                      if (part.state === "input-streaming" || part.state === "input-available") {
                        const inp = part.input as
                          | { edad_meses?: number; idioma?: "es" | "en" }
                          | undefined
                        const edad = inp?.edad_meses ?? 24
                        const idioma = inp?.idioma ?? "es"
                        return (
                          <MchatQuestionnaire
                            key={i}
                            edadMeses={edad}
                            idioma={idioma}
                            onSubmit={(output) => {
                              addToolOutput({
                                tool: "iniciar_cuestionario_mchat",
                                toolCallId: part.toolCallId,
                                output,
                              })
                            }}
                          />
                        )
                      }
                      if (part.state === "output-available") {
                        const out = part.output
                        return (
                          <div
                            key={i}
                            className="rounded-xl border border-border/60 bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
                          >
                            {out.cancelado
                              ? "Cuestionario cancelado."
                              : `Cuestionario completado (${out.respuestas.length} respuestas, ${out.edad_meses} meses).`}
                          </div>
                        )
                      }
                      return null
                    }

                    // --- TOOL: evaluar_riesgo_mchat (server) ---
                    if (part.type === "tool-evaluar_riesgo_mchat") {
                      if (part.state === "input-available") {
                        return <ToolPending key={i} label="Calculando puntuación M-CHAT-R/F…" />
                      }
                      if (part.state === "output-available") {
                        const o = part.output
                        return (
                          <RiskMeter
                            key={i}
                            score={o.score}
                            riesgo={o.riesgo}
                            itemsEnRiesgo={o.itemsEnRiesgo}
                            edadMeses={o.edad_meses}
                            recomendacion={o.recomendacion}
                          />
                        )
                      }
                      if (part.state === "output-error") {
                        return <ToolError key={i} text={part.errorText ?? "Error de evaluación"} />
                      }
                      return null
                    }

                    // --- TOOL: sugerir_ejercicios_denver (server) ---
                    if (part.type === "tool-sugerir_ejercicios_denver") {
                      if (part.state === "input-available") {
                        return <ToolPending key={i} label="Preparando ejercicios Denver…" />
                      }
                      if (part.state === "output-available") {
                        const o = part.output
                        return (
                          <DenverCards
                            key={i}
                            edadMeses={o.edad_meses}
                            nivelRiesgo={o.nivel_riesgo}
                            areaFoco={o.area_foco}
                            contextoDiario={o.contexto_diario}
                            ejercicios={[...o.ejercicios]}
                            principioClave={o.principio_clave}
                          />
                        )
                      }
                      if (part.state === "output-error") {
                        return <ToolError key={i} text={part.errorText ?? "Error al generar ejercicios"} />
                      }
                      return null
                    }

                    // --- TOOL: solicitar_video (client-side UI) ---
                    if (part.type === "tool-solicitar_video") {
                      if (part.state === "input-streaming" || part.state === "input-available") {
                        const inp = part.input as
                          | {
                              motivo?: string
                              marcadores_sugeridos?: Array<
                                "contacto_visual" | "respuesta_nombre" | "aleteo_manos" | "senalamiento"
                              >
                            }
                          | undefined
                        return (
                          <VideoUploader
                            key={i}
                            motivo={inp?.motivo ?? "Analizar el comportamiento en contexto real."}
                            marcadoresSugeridos={inp?.marcadores_sugeridos ?? ["contacto_visual"]}
                            onSubmit={(output) => {
                              addToolOutput({
                                tool: "solicitar_video",
                                toolCallId: part.toolCallId,
                                output,
                              })
                            }}
                          />
                        )
                      }
                      if (part.state === "output-available") {
                        return (
                          <div
                            key={i}
                            className="rounded-xl border border-border/60 bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
                          >
                            {part.output.cancelado
                              ? "Video no enviado."
                              : "Video recibido correctamente."}
                          </div>
                        )
                      }
                      return null
                    }

                    // --- TOOL: analizar_video_conducta (server) ---
                    if (part.type === "tool-analizar_video_conducta") {
                      if (part.state === "input-available") {
                        return <ToolPending key={i} label="Analizando marcadores conductuales…" />
                      }
                      if (part.state === "output-available") {
                        const o = part.output
                        return (
                          <VideoAnalysisCard
                            key={i}
                            videoUri={o.video_uri}
                            duracionSeg={o.duracion_analizada_seg}
                            resultados={[...o.resultados]}
                            alertaClinica={o.alerta_clinica}
                            nota={o.nota}
                          />
                        )
                      }
                      if (part.state === "output-error") {
                        return <ToolError key={i} text={part.errorText ?? "Error de análisis"} />
                      }
                      return null
                    }

                    return null
                  })}
                </div>

                {m.role === "user" && <UserAvatar />}
              </motion.div>
            ))}
          </AnimatePresence>

          {isBusy && (
            <div className="flex gap-3">
              <AssistantAvatar />
              <div className="rounded-2xl rounded-bl-sm bg-card px-4 py-3 shadow-sm ring-1 ring-border/60">
                <TypingDots />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border/60 bg-background/90 px-4 py-4 backdrop-blur md:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <form
            onSubmit={onSubmit}
            className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  onSubmit(e)
                }
              }}
              rows={1}
              placeholder="Describe lo que observas en tu hijo/a…"
              aria-label="Mensaje para MIRA"
              className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
              disabled={isBusy}
            />
            {isBusy ? (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => stop()}
                aria-label="Detener"
              >
                <span className="size-3 rounded-sm bg-foreground" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                className="rounded-xl"
                disabled={!input.trim()}
                aria-label="Enviar"
              >
                <ArrowUp className="size-4" />
              </Button>
            )}
          </form>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            MIRA no reemplaza la evaluación de un profesional de salud.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ---------------- Helpers ---------------- */

function WelcomeCard({ onPick }: { onPick: (t: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-5" />
        </span>
        <h1 className="font-serif text-xl font-semibold">
          Bienvenido a MIRA
        </h1>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Soy tu acompañante para el cribado temprano del desarrollo infantil.
        Cuéntame qué observas en tu hijo/a y te guiaré con empatía paso a paso.
        Aplicamos el cuestionario validado <strong className="text-foreground">M-CHAT-R/F</strong>,
        sugerimos ejercicios del <strong className="text-foreground">Modelo Denver</strong> y
        podemos analizar videos si es útil.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-lg border border-border/70 bg-background px-3 py-2 text-left text-[13px] text-foreground/85 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

function AssistantAvatar() {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
      <Sparkles className="size-4" />
    </span>
  )
}

function UserAvatar() {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground ring-1 ring-border/60">
      <span className="text-[11px] font-semibold">Tú</span>
    </span>
  )
}

function TypingDots() {
  return (
    <span
      aria-label="MIRA está escribiendo"
      className="flex items-center gap-1"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground/60"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{
            repeat: Infinity,
            duration: 1,
            delay: i * 0.15,
          }}
        />
      ))}
    </span>
  )
}

function ToolPending({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
      <motion.span
        className="size-2 rounded-full bg-primary/70"
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ repeat: Infinity, duration: 1 }}
      />
      {label}
    </div>
  )
}

function ToolError({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground">
      {text}
    </div>
  )
}
