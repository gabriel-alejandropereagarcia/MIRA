import { tool } from "ai"
import { z } from "zod"

/* -----------------------------------------------------------
 * M-CHAT-R/F — scoring table
 * Items 2, 5 y 12: "SÍ" suma riesgo. Resto: "NO" suma riesgo.
 * ----------------------------------------------------------- */
const YES_IS_RISK = new Set([2, 5, 12])

export function scoreMchat(respuestas: boolean[]): {
  score: number
  riesgo: "bajo" | "medio" | "alto"
  itemsEnRiesgo: number[]
} {
  const itemsEnRiesgo: number[] = []
  respuestas.forEach((resp, idx) => {
    const item = idx + 1
    const yesIsRisk = YES_IS_RISK.has(item)
    if (yesIsRisk ? resp === true : resp === false) itemsEnRiesgo.push(item)
  })
  const score = itemsEnRiesgo.length
  const riesgo: "bajo" | "medio" | "alto" =
    score <= 2 ? "bajo" : score <= 7 ? "medio" : "alto"
  return { score, riesgo, itemsEnRiesgo }
}

/* -----------------------------------------------------------
 * Tool 1 — iniciar_cuestionario_mchat (client-side render)
 * No tiene execute: el cliente renderiza el formulario y
 * devuelve las respuestas con addToolOutput.
 * ----------------------------------------------------------- */
export const iniciarCuestionarioMchatTool = tool({
  // Rich semantic guidance lives in the cached MIRA knowledge base.
  description: "Abre el formulario M-CHAT-R/F. Ver semántica en base cacheada.",
  inputSchema: z.object({
    edad_meses: z
      .number()
      .int()
      .min(16)
      .max(30)
      .describe("Edad del niño en meses (16-30)."),
    idioma: z.enum(["es", "en"]).describe("Idioma de los ítems del cuestionario."),
  }),
  outputSchema: z.object({
    // Length is 20 on submit, 0 when the user cancels — keep it lenient
    // so the output-schema validation never rejects a legitimate cancel.
    respuestas: z.array(z.boolean()).max(20),
    edad_meses: z.number().int(),
    cancelado: z.boolean(),
  }),
})

/* -----------------------------------------------------------
 * Tool 2 — evaluar_riesgo_mchat (server-side execute)
 * ----------------------------------------------------------- */
export const evaluarRiesgoMchatTool = tool({
  description: "Puntúa las 20 respuestas del M-CHAT-R/F. Ver reglas en base cacheada.",
  inputSchema: z.object({
    respuestas: z
      .array(z.boolean())
      .length(20)
      .describe("Array de 20 booleanos (true=SÍ, false=NO) para los ítems 1-20."),
    edad_meses: z.number().int().min(16).max(30),
  }),
  execute: async ({ respuestas, edad_meses }) => {
    const { score, riesgo, itemsEnRiesgo } = scoreMchat(respuestas)
    const recomendacion =
      riesgo === "bajo"
        ? "Seguir observando el desarrollo. Si el niño es menor de 24 meses, repetir el cribado a esa edad."
        : riesgo === "medio"
        ? "Se recomienda aplicar la entrevista de seguimiento (M-CHAT-R/F Follow-Up) y comenzar con rutinas ESDM de apoyo."
        : "Derivación inmediata a evaluación diagnóstica profesional (neuropediatra / especialista en desarrollo)."
    return {
      score,
      riesgo,
      itemsEnRiesgo,
      edad_meses,
      recomendacion,
      timestamp: new Date().toISOString(),
    }
  },
})

/* -----------------------------------------------------------
 * Tool 3 — sugerir_ejercicios_denver (server-side execute)
 * ----------------------------------------------------------- */
const DENVER_LIBRARY = {
  imitacion: [
    {
      titulo: "Espejo de sonrisas",
      duracion: "5 min",
      pasos: [
        "Siéntate frente al niño, a su altura.",
        "Haz un gesto exagerado (sonrisa amplia, lengua afuera).",
        "Espera 3 segundos a que imite. Refuerza con aplauso suave.",
      ],
    },
    {
      titulo: "Bloques que copian",
      duracion: "8 min",
      pasos: [
        "Apila 2 bloques y di «torre».",
        "Dale 2 bloques idénticos y espera.",
        "Celebra cualquier intento, aunque caiga la torre.",
      ],
    },
  ],
  comunicacion_no_verbal: [
    {
      titulo: "Dame la mano",
      duracion: "4 min",
      pasos: [
        "Muéstrale un objeto interesante fuera de su alcance.",
        "Modela el gesto de «dame» con la mano extendida.",
        "Entrega el objeto en cuanto haga cualquier gesto dirigido.",
      ],
    },
    {
      titulo: "Burbujas de atención",
      duracion: "6 min",
      pasos: [
        "Sopla burbujas una vez y detén.",
        "Espera a que te mire o haga un sonido pidiendo más.",
        "Responde inmediatamente a su señal comunicativa.",
      ],
    },
  ],
  juego_simbolico: [
    {
      titulo: "Hora del té",
      duracion: "10 min",
      pasos: [
        "Simula servir té en una taza vacía y «bebe».",
        "Ofrece la taza al niño narrando: «mmm, rico».",
        "Incluye un peluche como tercer invitado.",
      ],
    },
  ],
  atencion_conjunta: [
    {
      titulo: "Señalar lo interesante",
      duracion: "5 min",
      pasos: [
        "Coloca un juguete sorpresa a distancia.",
        "Señala con el dedo índice diciendo «¡mira!».",
        "Celebra cuando sus ojos sigan tu dedo al objeto.",
      ],
    },
    {
      titulo: "Libro compartido",
      duracion: "7 min",
      pasos: [
        "Sentados juntos, señala una imagen y nómbrala.",
        "Pregunta «¿dónde está el perrito?» y espera.",
        "Refuerza cualquier mirada conjunta con un comentario cálido.",
      ],
    },
  ],
} as const

export const sugerirEjerciciosDenverTool = tool({
  description: "Genera ejercicios ESDM (Denver). Ver áreas y contextos en base cacheada.",
  inputSchema: z.object({
    edad_meses: z.number().int().min(12).max(48),
    nivel_riesgo: z.enum(["medio", "alto"]),
    area_foco: z.enum([
      "imitacion",
      "comunicacion_no_verbal",
      "juego_simbolico",
      "atencion_conjunta",
    ]),
    contexto_diario: z
      .enum(["juego_piso", "hora_comida", "vestirse", "bano"])
      .nullable()
      .describe("Contexto cotidiano donde aplicar el ejercicio. Puede ser null."),
  }),
  execute: async ({ edad_meses, nivel_riesgo, area_foco, contexto_diario }) => {
    const ejercicios = DENVER_LIBRARY[area_foco] ?? []
    return {
      edad_meses,
      nivel_riesgo,
      area_foco,
      contexto_diario: contexto_diario ?? "juego_piso",
      ejercicios,
      principio_clave:
        "Sigue el liderazgo del niño, ponte a su altura y refuerza cada intento con afecto positivo.",
    }
  },
})

/* -----------------------------------------------------------
 * Tool 3.5 — iniciar_followup_mchat (client-side render)
 * Stage 2 del M-CHAT-R/F. Se invoca cuando Stage 1 dio MEDIO
 * (3-7 puntos) para reducir falsos positivos. Para cada ítem
 * fallado el cuidador responde si el comportamiento PASA o FALLA.
 * ----------------------------------------------------------- */
export const iniciarFollowupMchatTool = tool({
  description:
    "Abre el formulario de Follow-Up del M-CHAT-R/F para clarificar ítems fallados.",
  inputSchema: z.object({
    items_fallados: z
      .array(z.number().int().min(1).max(20))
      .min(1)
      .describe("Array de números de ítems que fallaron en Stage 1."),
    edad_meses: z.number().int().min(16).max(30),
    idioma: z.enum(["es", "en"]),
  }),
  outputSchema: z.object({
    resultados_followup: z.array(
      z.object({
        item: z.number(),
        // true = el ítem PASA (no riesgo), false = FALLA (riesgo persiste)
        pasa: z.boolean(),
      }),
    ),
    edad_meses: z.number().int(),
    cancelado: z.boolean(),
  }),
})

/* -----------------------------------------------------------
 * Tool 3.6 — evaluar_followup_mchat (server-side execute)
 * ----------------------------------------------------------- */
export const evaluarFollowupMchatTool = tool({
  description: "Evalúa los resultados del Follow-Up del M-CHAT-R/F.",
  inputSchema: z.object({
    resultados_followup: z.array(
      z.object({
        item: z.number(),
        pasa: z.boolean(),
      }),
    ),
    edad_meses: z.number().int().min(16).max(30),
    score_stage1: z.number().int().min(0).max(20),
  }),
  execute: async ({ resultados_followup, edad_meses, score_stage1 }) => {
    const itemsFallados = resultados_followup
      .filter((r) => !r.pasa)
      .map((r) => r.item)
    const followUpScore = itemsFallados.length
    const resultado: "positivo" | "negativo" =
      followUpScore >= 2 ? "positivo" : "negativo"

    const recomendacion =
      resultado === "positivo"
        ? "El resultado del Follow-Up confirma señales de riesgo. Se recomienda firmemente solicitar una evaluación diagnóstica formal con un neuropediatra o especialista en desarrollo infantil."
        : "El Follow-Up no confirma riesgo significativo. Continuar observando el desarrollo y repetir el cribado si surgen nuevas preocupaciones."

    return {
      score_stage1,
      followup_score: followUpScore,
      resultado,
      items_que_fallan_followup: itemsFallados,
      total_items_evaluados: resultados_followup.length,
      edad_meses,
      recomendacion,
      timestamp: new Date().toISOString(),
    }
  },
})

/* -----------------------------------------------------------
 * Tool 4 — solicitar_video (client-side render)
 * ----------------------------------------------------------- */
export const solicitarVideoTool = tool({
  description: "Abre el cargador de video. Ver criterios en base cacheada.",
  inputSchema: z.object({
    motivo: z
      .string()
      .describe("Razón breve, explicable al cuidador, por la que pides el video."),
    marcadores_sugeridos: z
      .array(
        z.enum([
          "contacto_visual",
          "respuesta_nombre",
          "aleteo_manos",
          "senalamiento",
        ]),
      )
      .min(1)
      .max(4),
  }),
  outputSchema: z.object({
    video_uri: z.string(),
    // The mime type returned by the Gemini File API after upload — required
    // to reattach the file in `analizar_video_conducta`'s `fileData` block.
    // Empty string when `cancelado: true`.
    mime_type: z.string(),
    marcadores: z.array(z.string()),
    cancelado: z.boolean(),
  }),
})

/* -----------------------------------------------------------
 * Tool 5 — analizar_video_conducta (server-side execute, REAL)
 * Llama a Gemini 2.5 Flash con `fileData` para inferir presencia
 * de marcadores conductuales. El URI proviene de la File API
 * y se obtuvo previamente vía /api/upload-video.
 * ----------------------------------------------------------- */

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

/**
 * Coerce raw model output into a safe Presencia value. The model is
 * instructed to use one of four labels, but if it deviates we fall
 * back to "no_evaluable" so the rest of the pipeline stays valid.
 */
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

export const analizarVideoConductaTool = tool({
  description:
    "Analiza marcadores conductuales en un video usando Gemini Vision. Ver base cacheada.",
  inputSchema: z.object({
    video_uri: z
      .string()
      .describe(
        "URI del archivo en la File API de Gemini (https://generativelanguage.googleapis.com/...).",
      ),
    mime_type: z
      .string()
      .nullable()
      .describe("Mime type del video (e.g. video/mp4). Puede ser null."),
    marcadores: z
      .array(
        z.enum([
          "contacto_visual",
          "respuesta_nombre",
          "aleteo_manos",
          "senalamiento",
        ]),
      )
      .min(1),
  }),
  execute: async ({ video_uri, mime_type, marcadores }) => {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      throw new Error(
        "GOOGLE_API_KEY_REQUIRED: GOOGLE_GENERATIVE_AI_API_KEY no está configurada.",
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
          fileData: {
            mimeType: mime_type ?? "video/mp4",
            fileUri: video_uri,
          },
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
      console.log(
        "[v0] analizar_video_conducta: Gemini call failed:",
        (err as Error).message,
      )
      throw new Error(
        "No se pudo analizar el video. " + (err as Error).message,
      )
    }

    // Normalize and ensure every requested marker has a result, even
    // if the model omitted it. Missing markers become "no_evaluable".
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
    const duracion = Math.max(0, Math.round(Number(parsed.duracion_estimada_seg ?? 0)))
    const notaGeneral =
      typeof parsed.nota_general === "string" ? parsed.nota_general : ""

    return {
      video_uri,
      duracion_analizada_seg: duracion,
      resultados,
      alerta_clinica: alertaClinica,
      calidad_video: calidadVideo,
      nota:
        "Este análisis es orientativo y fue generado por IA. La evaluación clínica definitiva corresponde a un profesional de salud calificado." +
        (notaGeneral ? " " + notaGeneral : ""),
    }
  },
})

/* -----------------------------------------------------------
 * Tool 6 — generar_informe_pediatra (client-side render)
 * Auto-genera y descarga el PDF profesional con los datos
 * acumulados de la sesión (perfil + Stage 1 + Follow-Up).
 * ----------------------------------------------------------- */
export const generarInformeTool = tool({
  description:
    "Genera y descarga un informe PDF profesional para llevar al pediatra.",
  inputSchema: z.object({
    motivo: z
      .string()
      .describe(
        "Breve contexto, mostrado al cuidador, de por qué se genera el informe ahora.",
      ),
  }),
  outputSchema: z.object({
    generado: z.boolean(),
  }),
})

/* -----------------------------------------------------------
 * Tools map + typed UIMessage
 * ----------------------------------------------------------- */
export const miraTools = {
  iniciar_cuestionario_mchat: iniciarCuestionarioMchatTool,
  evaluar_riesgo_mchat: evaluarRiesgoMchatTool,
  iniciar_followup_mchat: iniciarFollowupMchatTool,
  evaluar_followup_mchat: evaluarFollowupMchatTool,
  sugerir_ejercicios_denver: sugerirEjerciciosDenverTool,
  solicitar_video: solicitarVideoTool,
  analizar_video_conducta: analizarVideoConductaTool,
  generar_informe_pediatra: generarInformeTool,
} as const
