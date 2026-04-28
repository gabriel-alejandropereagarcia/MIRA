import { NextResponse } from "next/server"

/**
 * POST /api/analyze-video
 *
 * Receives a Gemini File API URI (already uploaded via /api/upload-video)
 * and a list of behavioural markers, and returns the structured analysis
 * produced by Gemini Vision. This used to live as the `execute` of the
 * `analizar_video_conducta` tool, but moving it to a dedicated endpoint
 * lets the client deterministically chain UI -> upload -> analyze in
 * a single step instead of relying on the model to invoke a second
 * tool after the first one resolves.
 */

const MARCADOR_DESCRIPCIONES: Record<string, string> = {
  contacto_visual:
    "contacto visual (¿el niño mira a los ojos de las personas con quienes interactúa?)",
  respuesta_nombre:
    "respuesta al nombre (¿el niño gira la cabeza, mira o reacciona cuando lo llaman por su nombre?)",
  aleteo_manos:
    "aleteo de manos o movimientos repetitivos (¿se observan movimientos estereotipados de manos, dedos o cuerpo?)",
  senalamiento:
    "señalamiento con dedo índice (¿el niño señala objetos o personas para pedir, mostrar o compartir interés?)",
}

const PRESENCIA = ["presente", "inconsistente", "ausente", "no_evaluable"] as const
const CALIDAD = ["buena", "aceptable", "baja"] as const

type Presencia = (typeof PRESENCIA)[number]
type Calidad = (typeof CALIDAD)[number]

function asPresencia(v: unknown): Presencia {
  return (PRESENCIA as readonly string[]).includes(v as string)
    ? (v as Presencia)
    : "no_evaluable"
}

function asCalidad(v: unknown): Calidad {
  return (CALIDAD as readonly string[]).includes(v as string)
    ? (v as Calidad)
    : "aceptable"
}

const VALID_MARCADORES = new Set([
  "contacto_visual",
  "respuesta_nombre",
  "aleteo_manos",
  "senalamiento",
])

export const runtime = "nodejs"
export const maxDuration = 120

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_GENERATIVE_AI_API_KEY no está configurada." },
      { status: 500 },
    )
  }

  let body: {
    video_uri?: string
    mime_type?: string | null
    marcadores?: string[]
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 })
  }

  const videoUri = typeof body.video_uri === "string" ? body.video_uri : ""
  const mimeType =
    typeof body.mime_type === "string" && body.mime_type.length > 0
      ? body.mime_type
      : "video/mp4"
  const marcadores = (body.marcadores ?? []).filter((m) =>
    VALID_MARCADORES.has(m),
  )

  if (!videoUri) {
    return NextResponse.json({ error: "Falta video_uri." }, { status: 400 })
  }
  if (marcadores.length === 0) {
    return NextResponse.json(
      { error: "Debes seleccionar al menos un marcador a analizar." },
      { status: 400 },
    )
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai")
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

  const marcadoresTexto = marcadores
    .map((m) => `- ${m}: ${MARCADOR_DESCRIPCIONES[m] ?? m}`)
    .join("\n")

  const prompt = `Eres un asistente de cribado del desarrollo infantil. Analiza este video de un niño/a y evalúa SOLO los siguientes marcadores conductuales observables:
${marcadoresTexto}

Para CADA marcador, responde EXACTAMENTE en este formato JSON:
{
  "resultados": [
    {
      "marcador": "nombre_del_marcador",
      "presencia": "presente" | "inconsistente" | "ausente" | "no_evaluable",
      "confianza": 0.0 a 1.0,
      "observacion": "descripción breve de lo que observaste en el video (máx 1 frase)"
    }
  ],
  "duracion_estimada_seg": número entero estimado de segundos analizados,
  "calidad_video": "buena" | "aceptable" | "baja",
  "nota_general": "observación general sobre el video (máx 1 frase)"
}

REGLAS CRÍTICAS:
- Si la calidad del video NO permite evaluar un marcador, marca como "no_evaluable" con confianza 0.0.
- NUNCA inventes observaciones que no puedas ver en el video.
- Este análisis es ORIENTATIVO, no diagnóstico.
- Sé conservador: es mejor marcar "no_evaluable" que dar un falso resultado.
- Responde SOLO con el JSON, sin texto adicional, sin bloques de código markdown.`

  let parsed: {
    resultados?: Array<{
      marcador?: string
      presencia?: string
      confianza?: number
      observacion?: string
    }>
    duracion_estimada_seg?: number
    calidad_video?: string
    nota_general?: string
  }

  try {
    const result = await model.generateContent([
      {
        fileData: { mimeType, fileUri: videoUri },
      },
      { text: prompt },
    ])
    const responseText = result.response.text()
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Respuesta sin JSON válido.")
    }
    parsed = JSON.parse(jsonMatch[0])
  } catch (err) {
    console.log("[v0] /api/analyze-video error:", (err as Error).message)
    return NextResponse.json(
      {
        error:
          "No se pudo analizar el video. " +
          ((err as Error).message ?? "Error desconocido."),
      },
      { status: 502 },
    )
  }

  type RawResult = NonNullable<typeof parsed.resultados>[number]
  const byName = new Map<string, RawResult>()
  for (const r of parsed.resultados ?? []) {
    if (r?.marcador) byName.set(r.marcador, r)
  }
  const resultados = marcadores.map((m) => {
    const raw = byName.get(m)
    const conf = Math.max(0, Math.min(1, Number(raw?.confianza ?? 0)))
    return {
      marcador: m,
      presencia: asPresencia(raw?.presencia),
      confianza: Math.round(conf * 100) / 100,
      observacion:
        typeof raw?.observacion === "string" && raw.observacion.length > 0
          ? raw.observacion
          : "Sin observación disponible para este marcador.",
    }
  })

  const alertaClinica = resultados.some(
    (r) => r.presencia === "ausente" && r.confianza >= 0.6,
  )
  const calidadVideo = asCalidad(parsed.calidad_video)
  const duracion = Math.max(
    0,
    Math.round(Number(parsed.duracion_estimada_seg ?? 0)),
  )
  const notaGeneral =
    typeof parsed.nota_general === "string" ? parsed.nota_general : ""

  return NextResponse.json({
    duracion_analizada_seg: duracion,
    resultados,
    alerta_clinica: alertaClinica,
    calidad_video: calidadVideo,
    nota:
      "Este análisis es orientativo y fue generado por IA. La evaluación clínica definitiva corresponde a un profesional de salud calificado." +
      (notaGeneral ? " " + notaGeneral : ""),
  })
}
