/**
 * MIRA — POST /api/upload-video
 *
 * Receives a video from the browser (multipart/form-data, field "video"),
 * forwards it to Google's File API via `GoogleAIFileManager.uploadFile`,
 * and waits for it to leave the PROCESSING state. Returns the file URI
 * + mime type so the chat tool `analizar_video_conducta` can reference
 * it directly with `fileData` in a Gemini multimodal call.
 *
 * Limits enforced server-side:
 *   - max size: 50 MB (defensive — the SDK itself enforces 2 GB).
 *   - max poll wait: ~110s, leaving margin under the 120s function ceiling.
 */

import { GoogleAIFileManager, FileState } from "@google/generative-ai/server"

export const runtime = "nodejs"
export const maxDuration = 120

const MAX_BYTES = 50 * 1024 * 1024

export async function POST(req: Request): Promise<Response> {
  // ---- 1. Parse the upload --------------------------------------------------
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return Response.json(
      { error: "No se pudo leer el formulario." },
      { status: 400 },
    )
  }

  const file = formData.get("video")
  if (!(file instanceof File)) {
    return Response.json(
      { error: "Debes adjuntar un archivo de video en el campo 'video'." },
      { status: 400 },
    )
  }

  if (!file.type || !file.type.startsWith("video/")) {
    return Response.json(
      { error: "El archivo enviado no es un video." },
      { status: 400 },
    )
  }

  if (file.size === 0) {
    return Response.json(
      { error: "El archivo está vacío." },
      { status: 400 },
    )
  }

  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "Video demasiado grande (máx 50 MB)." },
      { status: 413 },
    )
  }

  // ---- 2. Validate API key --------------------------------------------------
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Falta GOOGLE_GENERATIVE_AI_API_KEY. Configura la variable de entorno antes de subir videos.",
      },
      { status: 500 },
    )
  }

  // ---- 3. Upload to the Gemini File API -------------------------------------
  const fileManager = new GoogleAIFileManager(apiKey)
  const buffer = Buffer.from(await file.arrayBuffer())

  let upload
  try {
    upload = await fileManager.uploadFile(buffer, {
      mimeType: file.type,
      displayName: file.name || "mira-video",
    })
  } catch (err) {
    console.log(
      "[v0] upload-video: uploadFile failed:",
      (err as Error).message,
    )
    return Response.json(
      { error: "No se pudo subir el video al servicio de análisis." },
      { status: 502 },
    )
  }

  // ---- 4. Wait for PROCESSING -> ACTIVE -------------------------------------
  // The Gemini File API needs a few seconds to transcode video frames before
  // it can be used in a generateContent call. Poll until ACTIVE/FAILED, with
  // a hard stop well under the function ceiling.
  const POLL_MS = 2000
  const MAX_POLLS = 50 // ~100s total wait
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
      return Response.json(
        { error: "No se pudo verificar el estado del video." },
        { status: 502 },
      )
    }
    polls += 1
  }

  if (current.state === FileState.FAILED) {
    return Response.json(
      { error: "El servicio no pudo procesar el video. Prueba con otro." },
      { status: 422 },
    )
  }

  if (current.state !== FileState.ACTIVE) {
    return Response.json(
      {
        error:
          "El video sigue procesándose. Espera unos segundos e inténtalo de nuevo.",
      },
      { status: 504 },
    )
  }

  // ---- 5. Return the URI ----------------------------------------------------
  return Response.json({
    fileUri: current.uri,
    mimeType: current.mimeType,
    name: upload.file.name,
    sizeBytes: file.size,
  })
}
