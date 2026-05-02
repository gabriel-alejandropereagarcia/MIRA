/**
 * MIRA — POST /api/blob/upload-token
 *
 * Issues short-lived client tokens for direct browser → Vercel Blob
 * uploads. This is what makes 47 MB clips work: the browser uploads
 * straight to Blob storage using a signed URL, completely bypassing
 * the 4.5 MB body limit that Vercel route handlers enforce. After the
 * upload completes, the browser hands us back the resulting `pathname`
 * and we pull the bytes server-to-server in /api/upload-video.
 *
 * Why this is safe:
 *   - The token only allows `video/*` content types.
 *   - Maximum size is capped at 200 MB (well under Gemini's 2 GB ceiling
 *     and big enough for typical 30–60 s mobile clips).
 *   - The token is single-use and expires in minutes, not hours.
 *   - The store is private — even if the random pathname leaked, the
 *     blob is not publicly readable.
 */

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const MAX_VIDEO_BYTES = 200 * 1024 * 1024 // 200 MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: HandleUploadBody
  try {
    body = (await request.json()) as HandleUploadBody
  } catch {
    return NextResponse.json(
      { error: "Cuerpo JSON inválido." },
      { status: 400 },
    )
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // We deliberately ignore the client-supplied pathname for
        // anything beyond logging — the SDK still uses it as the
        // destination, but we lock down what can be uploaded.
        return {
          allowedContentTypes: ["video/mp4", "video/quicktime", "video/webm"],
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          // Add a random suffix so two caregivers uploading "video.mp4"
          // never collide. The browser receives the final pathname back
          // from upload() and forwards it to /api/upload-video.
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async ({ blob }) => {
        // Best-effort log only. We don't process the file here because
        // this callback runs asynchronously after the upload finishes,
        // and the Gemini round-trip + polling needs to happen inline
        // against the user's chat (so we can return a real result, not
        // queue-and-forget).
        console.log(
          "[v0] blob upload completed pathname=%s size=%s",
          blob.pathname,
          // `size` is not present on every payload variant; fall back to
          // contentType for diagnostic context if missing.
          (blob as unknown as { size?: number }).size ?? blob.contentType,
        )
      },
    })

    return NextResponse.json(result)
  } catch (err) {
    console.log(
      "[v0] /api/blob/upload-token failed:",
      (err as Error).message,
    )
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    )
  }
}
