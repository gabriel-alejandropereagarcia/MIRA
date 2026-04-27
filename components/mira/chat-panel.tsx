"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai"
import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, ArrowUp, CreditCard, ExternalLink, Heart, PanelLeft, RotateCw, Sparkles } from "lucide-react"
import type { MiraUIMessage } from "@/app/api/chat/route"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { RiskMeter } from "@/components/generative/risk-meter"
import { DenverCards } from "@/components/generative/denver-cards"
import { VideoUploader } from "@/components/generative/video-uploader"
import { VideoAnalysisCard } from "@/components/generative/video-analysis-card"
import { MchatQuestionnaire } from "@/components/generative/mchat-questionnaire"
import { MchatFollowUp } from "@/components/generative/mchat-followup"
import {
  AutoDownloadReport,
  DownloadReportButton,
} from "@/components/mira/report-generator"
import type { ReportData } from "@/components/mira/report-document"
import type { TriageState } from "@/components/mira/triage-sidebar"
import { MessageText } from "@/components/mira/message-text"
import { ThemeToggle } from "@/components/mira/theme-toggle"
import type { ChildProfile } from "@/lib/mira-storage"

type Props = {
  onStateChange: (state: TriageState) => void
  onToggleSidebar: () => void
  childProfile?: ChildProfile
}

const SUGGESTIONS = [
  "Mi hijo de 20 meses no señala con el dedo aún.",
  "Aplicar el cuestionario M-CHAT a mi hija de 22 meses.",
  "¿Qué ejercicios Denver ayudan con la atención conjunta?",
]

export function ChatPanel({
  onStateChange,
  onToggleSidebar,
  childProfile,
}: Props) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Keep the live profile inside a ref so the transport closure, which is
  // memoized once by useChat, always reads the most recent version without
  // forcing a re-subscription on every prop change.
  const profileRef = useRef<ChildProfile | undefined>(childProfile)
  profileRef.current = childProfile

  const transport = useMemo(
    () =>
      new DefaultChatTransport<MiraUIMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, id, trigger, messageId }) => ({
          body: {
            messages,
            id,
            trigger,
            messageId,
            childProfile: profileRef.current ?? null,
          },
        }),
      }),
    [],
  )

  const {
    messages,
    sendMessage,
    addToolOutput,
    status,
    stop,
    error,
    regenerate,
    clearError,
  } = useChat<MiraUIMessage>({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onError: (err) => {
      console.log("[v0] useChat error:", err?.message)
    },
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

  // Build the ReportData snapshot from the latest M-CHAT outputs in the
  // conversation. Returns null when there is no Stage 1 result yet — the
  // PDF cannot be meaningfully generated without it.
  const reportData = useMemo<ReportData | null>(() => {
    if (!childProfile) return null

    let mchat: {
      score: number
      riesgo: "bajo" | "medio" | "alto"
      itemsEnRiesgo: number[]
      recomendacion: string
    } | null = null
    let followUp: {
      score: number
      resultado: "positivo" | "negativo"
      itemsFallados: number[]
    } | null = null
    let followUpRecomendacion: string | null = null

    for (const m of messages) {
      for (const p of m.parts ?? []) {
        if (
          p.type === "tool-evaluar_riesgo_mchat" &&
          p.state === "output-available"
        ) {
          const o = p.output
          mchat = {
            score: o.score,
            riesgo: o.riesgo,
            itemsEnRiesgo: [...o.itemsEnRiesgo],
            recomendacion: o.recomendacion,
          }
        }
        if (
          p.type === "tool-evaluar_followup_mchat" &&
          p.state === "output-available"
        ) {
          const o = p.output
          followUp = {
            score: o.followup_score,
            resultado: o.resultado,
            itemsFallados: [...o.items_que_fallan_followup],
          }
          followUpRecomendacion = o.recomendacion
        }
      }
    }

    if (!mchat) return null

    return {
      child: {
        alias: childProfile.alias,
        ageMonths: childProfile.ageMonths,
        birthDate: childProfile.birthDate,
        sex: childProfile.sex,
        guardian: childProfile.guardian,
        concerns: childProfile.concerns,
      },
      mchat: {
        ...mchat,
        // When the Follow-Up has its own (more specific) recommendation
        // override the Stage-1 generic copy with it. The clinician needs
        // the most current guidance to read first.
        recomendacion: followUpRecomendacion ?? mchat.recomendacion,
      },
      followUp: followUp ?? undefined,
      date: new Date().toISOString(),
    }
  }, [messages, childProfile])

  // Index of the LAST assistant tool part that produced a risk result, so
  // we render the download CTA only once (right under the most recent
  // RiskMeter) instead of duplicating it after every prior result.
  const latestRiskKey = useMemo(() => {
    let key: string | null = null
    for (const m of messages) {
      for (let i = 0; i < (m.parts?.length ?? 0); i++) {
        const p = m.parts![i]
        if (
          (p.type === "tool-evaluar_riesgo_mchat" ||
            p.type === "tool-evaluar_followup_mchat") &&
          p.state === "output-available"
        ) {
          key = `${m.id}:${i}`
        }
      }
    }
    return key
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
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="hidden gap-1.5 border-primary/30 bg-primary/5 text-primary sm:flex"
          >
            <Heart className="size-3 fill-primary/30" />
            Cribado, no diagnóstico
          </Badge>
          <ThemeToggle />
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Conversación con MIRA"
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
                      if (part.state === "output-error") {
                        return (
                          <ToolError
                            key={i}
                            text={part.errorText ?? "Error al registrar respuestas."}
                          />
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
                        const showDownload =
                          `${m.id}:${i}` === latestRiskKey && reportData !== null
                        return (
                          <div key={i} className="flex flex-col gap-3">
                            <RiskMeter
                              score={o.score}
                              riesgo={o.riesgo}
                              itemsEnRiesgo={o.itemsEnRiesgo}
                              edadMeses={o.edad_meses}
                              recomendacion={o.recomendacion}
                            />
                            {showDownload && reportData && (
                              <DownloadReportButton data={reportData} />
                            )}
                          </div>
                        )
                      }
                      if (part.state === "output-error") {
                        return <ToolError key={i} text={part.errorText ?? "Error de evaluación"} />
                      }
                      return null
                    }

                    // --- TOOL: iniciar_followup_mchat (client-side UI) ---
                    if (part.type === "tool-iniciar_followup_mchat") {
                      if (part.state === "input-streaming" || part.state === "input-available") {
                        const inp = part.input as
                          | {
                              items_fallados?: number[]
                              edad_meses?: number
                              idioma?: "es" | "en"
                            }
                          | undefined
                        return (
                          <MchatFollowUp
                            key={i}
                            itemsFallados={inp?.items_fallados ?? []}
                            edadMeses={inp?.edad_meses ?? 24}
                            idioma={inp?.idioma ?? "es"}
                            onSubmit={(output) => {
                              addToolOutput({
                                tool: "iniciar_followup_mchat",
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
                              ? "Follow-Up cancelado."
                              : `Follow-Up completado (${out.resultados_followup.length} ítems revisados, ${out.edad_meses} meses).`}
                          </div>
                        )
                      }
                      if (part.state === "output-error") {
                        return (
                          <ToolError
                            key={i}
                            text={part.errorText ?? "Error al registrar Follow-Up."}
                          />
                        )
                      }
                      return null
                    }

                    // --- TOOL: evaluar_followup_mchat (server) ---
                    if (part.type === "tool-evaluar_followup_mchat") {
                      if (part.state === "input-available") {
                        return <ToolPending key={i} label="Calculando resultado Follow-Up…" />
                      }
                      if (part.state === "output-available") {
                        const o = part.output
                        const showDownload =
                          `${m.id}:${i}` === latestRiskKey && reportData !== null
                        return (
                          <div key={i} className="flex flex-col gap-3">
                            <RiskMeter
                              variant="followup"
                              scoreStage1={o.score_stage1}
                              followupScore={o.followup_score}
                              totalItemsEvaluados={o.total_items_evaluados}
                              resultadoFollowup={o.resultado}
                              itemsQueFallanFollowup={o.items_que_fallan_followup}
                              edadMeses={o.edad_meses}
                              recomendacion={o.recomendacion}
                            />
                            {showDownload && reportData && (
                              <DownloadReportButton data={reportData} />
                            )}
                          </div>
                        )
                      }
                      if (part.state === "output-error") {
                        return <ToolError key={i} text={part.errorText ?? "Error de evaluación Follow-Up"} />
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

                    // --- TOOL: generar_informe_pediatra (client-side UI) ---
                    if (part.type === "tool-generar_informe_pediatra") {
                      if (
                        part.state === "input-streaming" ||
                        part.state === "input-available"
                      ) {
                        const inp = part.input as { motivo?: string } | undefined
                        return (
                          <AutoDownloadReport
                            key={i}
                            data={reportData}
                            motivo={
                              inp?.motivo ??
                              "Estoy preparando un informe profesional con los resultados acumulados."
                            }
                            onComplete={(output) => {
                              addToolOutput({
                                tool: "generar_informe_pediatra",
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
                            {part.output.generado
                              ? "Informe descargado correctamente."
                              : "No fue posible descargar el informe en este momento."}
                          </div>
                        )
                      }
                      if (part.state === "output-error") {
                        return (
                          <ToolError
                            key={i}
                            text={part.errorText ?? "Error al generar el informe."}
                          />
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
                            calidadVideo={o.calidad_video}
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

      {/* Error banner */}
      {error && (
        <ErrorBanner
          error={error}
          onRetry={() => {
            clearError()
            regenerate()
          }}
          onDismiss={clearError}
        />
      )}

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

function ErrorBanner({
  error,
  onRetry,
  onDismiss,
}: {
  error: Error
  onRetry: () => void
  onDismiss: () => void
}) {
  const raw = error.message ?? ""
  const isBilling =
    raw.includes("GATEWAY_BILLING_REQUIRED") ||
    raw.includes("AI Gateway requires a valid credit card") ||
    raw.includes("customer_verification_required")
  const isGoogleKeyMissing =
    raw.includes("GOOGLE_API_KEY_REQUIRED") ||
    raw.includes("GOOGLE_GENERATIVE_AI_API_KEY") ||
    raw.includes("API key not valid")

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-amber-500/30 bg-amber-50 px-4 py-3 md:px-8 dark:bg-amber-950/30"
      role="alert"
    >
      <div className="mx-auto flex w-full max-w-3xl items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300">
          {isBilling ? (
            <CreditCard className="size-4" />
          ) : (
            <AlertTriangle className="size-4" />
          )}
        </span>

        <div className="flex-1 text-sm">
          {isGoogleKeyMissing ? (
            <>
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                Falta GOOGLE_GENERATIVE_AI_API_KEY
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-amber-900/80 dark:text-amber-200/80">
                MIRA ahora usa Google Gemini con context caching. Agrega la
                variable <code className="rounded bg-amber-500/15 px-1 py-0.5 text-[11px]">GOOGLE_GENERATIVE_AI_API_KEY</code> en la configuración del
                proyecto. Obtén una clave gratuita en
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1 inline-flex items-center gap-1 font-medium text-amber-900 underline underline-offset-2 hover:text-amber-700 dark:text-amber-200"
                >
                  AI Studio
                  <ExternalLink className="size-3" />
                </a>
                .
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-amber-900 hover:bg-amber-500/10 dark:text-amber-200"
                  onClick={onRetry}
                >
                  <RotateCw className="size-3" />
                  Reintentar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-amber-900/70 hover:bg-amber-500/10 dark:text-amber-200/70"
                  onClick={onDismiss}
                >
                  Cerrar
                </Button>
              </div>
            </>
          ) : isBilling ? (
            <>
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                Vercel AI Gateway requiere una tarjeta en el archivo
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-amber-900/80 dark:text-amber-200/80">
                MIRA usa el AI Gateway de Vercel para responder. Tu equipo aún
                no tiene un método de pago registrado, por lo que el modelo no
                puede ejecutarse. Agregar una tarjeta{" "}
                <strong>desbloquea los créditos gratuitos</strong> — no
                realizamos cargos automáticos.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a
                  href="https://vercel.com/d?to=%2F%5Bteam%5D%2F~%2Fai%3Fmodal%3Dadd-credit-card"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-amber-700"
                >
                  Agregar tarjeta
                  <ExternalLink className="size-3" />
                </a>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-amber-900 hover:bg-amber-500/10 dark:text-amber-200"
                  onClick={onRetry}
                >
                  <RotateCw className="size-3" />
                  Reintentar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-amber-900/70 hover:bg-amber-500/10 dark:text-amber-200/70"
                  onClick={onDismiss}
                >
                  Cerrar
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                No se pudo completar la respuesta
              </p>
              <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-amber-900/80 dark:text-amber-200/80">
                {raw || "Error desconocido al consultar al modelo."}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 border-amber-500/40 bg-transparent text-amber-900 hover:bg-amber-500/10 dark:text-amber-200"
                  onClick={onRetry}
                >
                  <RotateCw className="size-3" />
                  Reintentar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-amber-900/70 hover:bg-amber-500/10 dark:text-amber-200/70"
                  onClick={onDismiss}
                >
                  Cerrar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
