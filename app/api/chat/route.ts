import {
  convertToModelMessages,
  InferUITools,
  stepCountIs,
  streamText,
  UIDataTypes,
  UIMessage,
  validateUIMessages,
} from "ai"
import { google } from "@ai-sdk/google"
import { GOOGLE_MODEL, getMiraKnowledgeCache } from "@/lib/gemini-cache"
import { MIRA_DYNAMIC_INSTRUCTIONS } from "@/lib/mira-dynamic-instructions"
import { MIRA_STATIC_KNOWLEDGE_BASE } from "@/lib/mira-static-knowledge"
import { miraTools } from "@/lib/mira-tools"

export const maxDuration = 60

export type MiraUIMessage = UIMessage<
  never,
  UIDataTypes,
  InferUITools<typeof miraTools>
>

export async function POST(req: Request) {
  const body = await req.json()

  const messages = await validateUIMessages<MiraUIMessage>({
    messages: body.messages,
    tools: miraTools,
  })

  // Try to reuse (or lazily create) the Gemini context cache.
  // If the cache isn't available (missing key, below token threshold,
  // transient error), we fall back to sending the static block inline.
  const cacheName = await getMiraKnowledgeCache()
  const usingCache = Boolean(cacheName)

  const systemPrompt = usingCache
    ? MIRA_DYNAMIC_INSTRUCTIONS
    : `${MIRA_DYNAMIC_INSTRUCTIONS}\n\n---\n\n${MIRA_STATIC_KNOWLEDGE_BASE}`

  console.log(
    "[v0] /api/chat model=%s cache=%s",
    GOOGLE_MODEL,
    usingCache ? cacheName : "INLINE_FALLBACK",
  )

  const result = streamText({
    model: google(GOOGLE_MODEL),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: miraTools,
    stopWhen: stepCountIs(8),
    // The Vercel AI SDK Google provider passes `cachedContent` straight
    // through to Gemini's generateContent API. When set, the prefix is
    // billed at ~25% of normal input-token cost.
    providerOptions: usingCache
      ? { google: { cachedContent: cacheName! } }
      : undefined,
  })

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      console.log("[v0] /api/chat stream error:", error)
      if (error == null) return "Error desconocido."
      if (typeof error === "string") return error
      if (error instanceof Error) {
        // Explicit Google API key missing.
        if (
          error.message.includes("GOOGLE_GENERATIVE_AI_API_KEY") ||
          error.message.includes("API key not valid")
        ) {
          return "GOOGLE_API_KEY_REQUIRED"
        }
        // Legacy Gateway billing path (kept in case model is swapped back).
        if (
          error.message.includes("AI Gateway requires a valid credit card") ||
          error.message.includes("customer_verification_required")
        ) {
          return "GATEWAY_BILLING_REQUIRED"
        }
        return error.message
      }
      return JSON.stringify(error)
    },
  })
}
