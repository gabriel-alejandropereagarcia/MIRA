import {
  convertToModelMessages,
  InferUITools,
  stepCountIs,
  streamText,
  UIDataTypes,
  UIMessage,
  validateUIMessages,
} from "ai"
import { MIRA_SYSTEM_PROMPT } from "@/lib/mira-system-prompt"
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

  const result = streamText({
    model: "openai/gpt-5-mini",
    system: MIRA_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: miraTools,
    stopWhen: stepCountIs(8),
  })

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      console.log("[v0] /api/chat stream error:", error)
      if (error == null) return "Error desconocido."
      if (typeof error === "string") return error
      if (error instanceof Error) {
        // Surface Gateway billing issue to the client so the UI can react.
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
