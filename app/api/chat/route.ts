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

  return result.toUIMessageStreamResponse()
}
