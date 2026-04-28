/**
 * MIRA — Durable follow-up workflow.
 *
 * Built with the Vercel Workflow Development Kit (`workflow` + `@workflow/next`)
 * for the "Workflows (WDK)" track of the hackathon. The goal is to convert
 * MIRA into a *durable agent*: once a screening session ends and the PDF
 * is delivered, we kick off a workflow that pauses for an asynchronous,
 * clinically-anchored amount of time (7d / 15d / 30d / 90d) and only
 * then reaches out to the caregiver/pediatrician with a re-evaluation
 * reminder.
 *
 * The workflow itself is just an orchestrator. The real work
 * (sending notifications, eventually emails or push messages) lives in
 * step functions, so they get full Node.js access, automatic retries,
 * and persisted results across replays.
 */

import { sleep } from "workflow"

/**
 * The four clinical urgency buckets we surface to the workflow.
 *
 *  - ALTO        → screening flagged high risk (M-CHAT alto, or M-CHAT medio
 *                  with a positive Follow-Up). Re-evaluate in 7 days.
 *  - MEDIO       → M-CHAT medio with a negative Follow-Up, or M-CHAT
 *                  medio without a Follow-Up yet. Re-evaluate in 15 days.
 *  - BAJO_DUDAS  → M-CHAT bajo BUT caregiver reported concerns or there
 *                  are unchecked CDC red-flag milestones. Triangulation
 *                  said "we can't fully discharge". Re-evaluate in 30 days.
 *  - BAJO        → M-CHAT bajo with no caregiver concerns and no pending
 *                  red flags. Routine pediatric follow-up cadence.
 */
export type MiraRiskLevel = "ALTO" | "MEDIO" | "BAJO_DUDAS" | "BAJO"

export type MiraFollowUpInput = {
  email: string
  childName: string
  riskLevel: MiraRiskLevel
}

/**
 * Step — emit the follow-up notification.
 *
 * Marked with `"use step"` so it runs outside the workflow sandbox with
 * full Node.js access. Today it just prints to the server log (the spec
 * explicitly asks for a mock); when MIRA goes to production this is the
 * single place to plug Resend / Twilio / push notifications without
 * touching the workflow orchestration above.
 */
async function sendFollowUpNotification(input: {
  email: string
  childName: string
  riskLevel: MiraRiskLevel
  scheduledAt: string
}): Promise<{ delivered: boolean; channel: "console-mock" }> {
  "use step"

  const message =
    `[MIRA Durable Agent] Recordatorio de re-evaluación` +
    ` — niño/a: ${input.childName || "(sin alias)"} ` +
    `| nivel de riesgo: ${input.riskLevel} ` +
    `| destinatario: ${input.email || "(sin email)"} ` +
    `| programado al inicio de la espera: ${input.scheduledAt} ` +
    `| ahora: ${new Date().toISOString()}`

  // Single, well-formatted line so it's easy to grep both in local dev
  // and in the Vercel observability dashboard.
  console.log("[v0]", message)

  return { delivered: true, channel: "console-mock" }
}

/**
 * The durable workflow itself.
 *
 * Keep this function pure orchestration: NO Node.js APIs, NO side
 * effects beyond `sleep()` and step calls. Side effects belong in the
 * `"use step"` function above so the workflow can be replayed safely.
 */
export async function miraFollowUpWorkflow(
  data: MiraFollowUpInput,
): Promise<{
  delivered: boolean
  riskLevel: MiraRiskLevel
  waited: "7d" | "15d" | "30d" | "90d"
}> {
  "use workflow"

  const startedAt = new Date().toISOString()

  // Decide the asynchronous pause based on the clinical urgency. The
  // Workflow runtime persists this sleep — the function suspends, the
  // server can shut down, and execution resumes precisely after the
  // requested duration without consuming compute in the meantime.
  let waited: "7d" | "15d" | "30d" | "90d"
  switch (data.riskLevel) {
    case "ALTO":
      waited = "7d"
      await sleep("7d")
      break
    case "MEDIO":
      waited = "15d"
      await sleep("15d")
      break
    case "BAJO_DUDAS":
      waited = "30d"
      await sleep("30d")
      break
    case "BAJO":
    default:
      waited = "90d"
      await sleep("90d")
      break
  }

  const result = await sendFollowUpNotification({
    email: data.email,
    childName: data.childName,
    riskLevel: data.riskLevel,
    scheduledAt: startedAt,
  })

  return { delivered: result.delivered, riskLevel: data.riskLevel, waited }
}
