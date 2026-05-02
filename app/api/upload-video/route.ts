/**
 * MIRA — POST /api/upload-video
 *
 * NEW ARCHITECTURE (Nov 2026): The browser no longer uploads the video
 * bytes directly to this route — Vercel route handlers cap request
 * bodies at 4.5 MB, which made any clip larger than ~3 s of decent
 * quality fail with a silent 413 in the platform edge before reaching
 * our handler (the symptom users saw was "No se pudo subir el video"
 * with no server log line).
 *
 * The new flow:
 *   1. Browser calls /api/blob/upload-token to mint a short-lived,
 *      content-type-restricted client token.
 *   2. Browser uses @vercel/blob/client `upload()` to send the video
 *      DIRECTLY to Vercel Blob storage. No 4.5 MB ceiling.
 *   3. Browser POSTs `{ pathname, mimeType }` to THIS route. The body
 *      is tiny JSON, so the platform limit is irrelevant.
 *   4. THIS route streams the blob server-to-server, forwards it to
 *      the Gemini File API, polls until ACTIVE, deletes the temporary
 *      blob (it has served its purpose), and returns `{ fileUri,
 *      mimeType }`.
 *
 * Cleanup is best-effort — we always delete the blob on success, and
 * try to delete on error too, so we don't leak storage if the user
 * abandons the analysis.
 */

import { GoogleAIFileManager, FileState } from "@google/generative-ai/server"
import { del, get } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 120

const MAX_BYTES = 200 * 1024 * 1024 // 200 MB — must match the token endpoint.

interface UploadVideoRequest {
  pathname?: unknown
  mimeType?: unknown
  displayName?: unknown
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ---- 1. Parse JSON body ---------------------------------------------------
  let raw: UploadVideoRequest
  try {
    raw = (await req.json()) as UploadVideoRequest
  } catch {
    return NextResponse.json(
      { error: "Cuerpo JSON inválido." },
      { status: 400 },
    )
  }

  if (typeof raw.pathname !== "string" || raw.pathname.length === 0) {
    return NextResponse.json(
      { error: "Falta 'pathname' del blob." },
      { status: 400 },
    )
  }
  const pathname = raw.pathname
  const declaredMime =
    typeof raw.mimeType === "string" && raw.mimeType.length > 0
      ? raw.mimeType
      : null
  const displayName =
    typeof raw.displayName === "string" && raw.displayName.length > 0
      ? raw.displayName
      : "mira-video"

  // ---- 2. Validate API key --------------------------------------------------
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Falta GOOGLE_GENERATIVE_AI_API_KEY. Configura la variable de entorno antes de subir videos.",
      },
      { status: 500 },
    )
  }

  // ---- 3. Pull the blob bytes server-side -----------------------------------
  // `get()` fetches via Vercel's internal network — there is no 4.5 MB
  // body limit here because we are PULLING, not RECEIVING a POST.
  let buffer: Buffer
  let resolvedMime: string
  try {
    const result = await get(pathname, { access: "private" })
    if (!result) {
      return NextResponse.json(
        { error: "No se encontró el video en el almacenamiento temporal." },
        { status: 404 },
      )
    }
    const arrayBuf = await new Response(result.stream).arrayBuffer()
    buffer = Buffer.from(arrayBuf)
    resolvedMime = declaredMime ?? result.blob.contentType ?? "video/mp4"

    if (buffer.byteLength === 0) {
      await safeDelete(pathname)
      return NextResponse.json(
        { error: "El archivo está vacío." },
        { status: 400 },
      )
    }
    if (buffer.byteLength > MAX_BYTES) {
      await safeDelete(pathname)
      return NextResponse.json(
        { error: "Video demasiado grande (máx 200 MB)." },
        { status: 413 },
      )
    }
    if (!resolvedMime.startsWith("video/")) {
      await safeDelete(pathname)
      return NextResponse.json(
        { error: "El archivo no es un video." },
        { status: 400 },
      )
    }
  } catch (err) {
    console.log(
      "[v0] upload-video: blob fetch failed:",
      (err as Error).message,
    )
    return NextResponse.json(
      { error: "No se pudo recuperar el video del almacenamiento." },
      { status: 502 },
    )
  }

  // ---- 4. Upload to the Gemini File API -------------------------------------
  const fileManager = new GoogleAIFileManager(apiKey)
  let upload
  try {
    upload = await fileManager.uploadFile(buffer, {
      mimeType: resolvedMime,
      displayName,
    })
  } catch (err) {
    console.log(
      "[v0] upload-video: Gemini uploadFile failed:",
      (err as Error).message,
    )
    await safeDelete(pathname)
    return NextResponse.json(
      { error: "No se pudo subir el video al servicio de análisis." },
      { status: 502 },
    )
  }

  // ---- 5. Wait for PROCESSING -> ACTIVE -------------------------------------
  // Gemini transcodes video frames before exposing the file as a
  // multimodal input. Poll until ACTIVE/FAILED, with a hard stop well
  // under the function ceiling.
  const POLL_MS = 2000
  const MAX_POLLS = 50 // ~100 s
  let current = upload.file
  let polls = 0
  while (current.state === FileState.PROCESSING && polls < MAX_POLLS) {
    await new Promise((r) => setTimeout(r, POLL_MS))
    try {
      current = await fileManager.getFile(upload.file.name)
    } catch (err) {
      console.log(
        "[v0] upload-video: getFile failed mid-poll:",
        (err as Error).message,
      )
      await safeDelete(pathname)
      return NextResponse.json(
        { error: "No se pudo verificar el estado del video." },
        { status: 502 },
      )
    }
    polls += 1
  }

  // The temporary blob has done its job — release it regardless of
  // outcome. Failures here are non-fatal; we'll just leak a few bytes.
  await safeDelete(pathname)

  if (current.state === FileState.FAILED) {
    return NextResponse.json(
      { error: "El servicio no pudo procesar el video. Prueba con otro." },
      { status: 422 },
    )
  }
  if (current.state !== FileState.ACTIVE) {
    return NextResponse.json(
      {
        error:
          "El video sigue procesándose. Espera unos segundos e inténtalo de nuevo.",
      },
      { status: 504 },
    )
  }

  // ---- 6. Return the URI ----------------------------------------------------
  return NextResponse.json({
    fileUri: current.uri,
    mimeType: current.mimeType,
    name: upload.file.name,
    sizeBytes: buffer.byteLength,
  })
}

/**
 * Delete a Blob without throwing. We never want a cleanup failure to
 * mask the real outcome of the analysis pipeline.
 */
async function safeDelete(pathname: string): Promise<void> {
  try {
    await del(pathname)
  } catch (err) {
    console.log(
      "[v0] upload-video: blob cleanup failed pathname=%s err=%s",
      pathname,
      (err as Error).message,
    )
  }
}
