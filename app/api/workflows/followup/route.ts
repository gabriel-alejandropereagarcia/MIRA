/**
 * MIRA — Trigger endpoint for the durable follow-up workflow.
 *
 * The frontend calls this POST handler exactly once, right after the
 * pediatrician PDF is generated. It validates the payload, hands it off
 * to the Workflow runtime via `start()`, and returns immediately with
 * the run id so the client can optionally surface it in observability.
 *
 * `start()` is fire-and-forget: it enqueues the workflow and returns;
 * it does NOT block on the durable `sleep()`. The actual re-evaluation
 * notification fires 7 / 15 / 30 / 90 days later, depending on the
 * clinical risk level we receive here.
 */

import { NextResponse } from "next/server"
import { start } from "workflow/api"
import {
  miraFollowUpWorkflow,
  type MiraRiskLevel,
} from "@/workflows/mira-follow-up"

// We must return immediately — never await the workflow itself.
export const runtime = "nodejs"

const VALID_LEVELS: readonly MiraRiskLevel[] = [
  "ALTO",
  "MEDIO",
  "BAJO_DUDAS",
  "BAJO",
] as const

function isValidRiskLevel(v: unknown): v is MiraRiskLevel {
  return (
    typeof v === "string" &&
    (VALID_LEVELS as readonly string[]).includes(v)
  )
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_JSON" },
      { status: 400 },
    )
  }

  const payload = body as Partial<{
    email: string
    childName: string
    riskLevel: MiraRiskLevel
  }>

  if (!isValidRiskLevel(payload.riskLevel)) {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_RISK_LEVEL",
        accepted: VALID_LEVELS,
      },
      { status: 400 },
    )
  }

  // Email and childName are optional today — the screening flow does
  // not always collect them — but we still pass them through so the
  // step function can log a meaningful identity. Defaults are empty
  // strings, never undefined, to keep the workflow signature strict.
  const input = {
    email: typeof payload.email === "string" ? payload.email : "",
    childName: typeof payload.childName === "string" ? payload.childName : "",
    riskLevel: payload.riskLevel,
  }

  try {
    const run = await start(miraFollowUpWorkflow, [input])
    console.log(
      "[v0] Durable follow-up workflow started runId=%s riskLevel=%s",
      run.runId,
      input.riskLevel,
    )
    return NextResponse.json({
      ok: true,
      runId: run.runId,
      riskLevel: input.riskLevel,
    })
  } catch (err) {
    console.log(
      "[v0] Failed to start follow-up workflow:",
      (err as Error).message,
    )
    return NextResponse.json(
      { ok: false, error: "WORKFLOW_START_FAILED" },
      { status: 500 },
    )
  }
}
