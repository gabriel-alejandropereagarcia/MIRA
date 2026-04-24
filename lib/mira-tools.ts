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
    respuestas: z.array(z.boolean()).length(20),
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
    marcadores: z.array(z.string()),
    cancelado: z.boolean(),
  }),
})

/* -----------------------------------------------------------
 * Tool 5 — analizar_video_conducta (server-side execute, simulado)
 * ----------------------------------------------------------- */
export const analizarVideoConductaTool = tool({
  description: "Analiza marcadores conductuales en un video. Ver base cacheada.",
  inputSchema: z.object({
    video_uri: z.string(),
    marcadores: z.array(
      z.enum([
        "contacto_visual",
        "respuesta_nombre",
        "aleteo_manos",
        "senalamiento",
      ]),
    ),
  }),
  execute: async ({ video_uri, marcadores }) => {
    // Simulación determinista a partir del hash del URI
    await new Promise((r) => setTimeout(r, 1200))
    const seed = Array.from(video_uri).reduce((a, c) => a + c.charCodeAt(0), 0)
    const resultados = marcadores.map((m, i) => {
      const v = ((seed + i * 37) % 100) / 100
      return {
        marcador: m,
        presencia: v > 0.45 ? "presente" : v > 0.25 ? "inconsistente" : "ausente",
        confianza: Math.round((0.6 + v * 0.35) * 100) / 100,
      }
    })
    const alerta = resultados.some(
      (r) => r.presencia === "ausente" && r.confianza >= 0.7,
    )
    return {
      video_uri,
      duracion_analizada_seg: 18,
      resultados,
      alerta_clinica: alerta,
      nota:
        "Este análisis es orientativo. La decisión clínica final corresponde a un profesional de la salud.",
    }
  },
})

/* -----------------------------------------------------------
 * Tools map + typed UIMessage
 * ----------------------------------------------------------- */
export const miraTools = {
  iniciar_cuestionario_mchat: iniciarCuestionarioMchatTool,
  evaluar_riesgo_mchat: evaluarRiesgoMchatTool,
  sugerir_ejercicios_denver: sugerirEjerciciosDenverTool,
  solicitar_video: solicitarVideoTool,
  analizar_video_conducta: analizarVideoConductaTool,
} as const
