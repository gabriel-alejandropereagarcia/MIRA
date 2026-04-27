"use client"

/**
 * MIRA — Informe clínico (PDF tree)
 *
 * This file uses @react-pdf/renderer which must run only on the client.
 * It is *intentionally* never imported statically by any page or layout —
 * `report-generator.tsx` loads it lazily through `await import(...)` from
 * inside a click handler so Next.js never tries to SSR it.
 *
 * The report is one page (overflows to a second when the M-CHAT failed-item
 * list is long) and follows a sober medical-report aesthetic: navy headers,
 * neutral grays, generous spacing, minimal lines.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"

/* ------------------------------------------------------------------------ */
/*  Types                                                                   */
/* ------------------------------------------------------------------------ */

export type Sex = "M" | "F" | "otro"

export type VideoMarkerResult = {
  marcador: string
  presencia: "presente" | "inconsistente" | "ausente" | "no_evaluable"
  confianza: number
  observacion: string
}

export type ReportData = {
  child: {
    alias: string
    ageMonths: number
    birthDate: string // ISO YYYY-MM-DD or empty
    sex: Sex | string
    guardian: string
    concerns: string[]
  }
  mchat: {
    score: number
    riesgo: "bajo" | "medio" | "alto"
    itemsEnRiesgo: number[]
    recomendacion: string
  }
  followUp?: {
    score: number
    resultado: "positivo" | "negativo"
    itemsFallados: number[]
  }
  /**
   * Optional: latest video analysis from `analizar_video_conducta`.
   * When present, the report renders the "Triangulación clínica" section
   * comparing subjective signals (parents/M-CHAT) with objective signals
   * (AI video analysis).
   */
  videoAnalysis?: {
    resultados: VideoMarkerResult[]
    calidadVideo: "buena" | "aceptable" | "baja"
    alertaClinica: boolean
    duracionSeg: number
    nota: string
  }
  /**
   * Optional: structured snapshot of caregiver-reported concerns and any
   * CDC red-flag milestones the caregiver did NOT check as observed in the
   * sidebar. Drives the "Subjetivo" half of the triangulation.
   */
  developmentalContext?: {
    redFlagMilestonesUnchecked: string[]
    bucketLabel: string | null
  }
  date: string // ISO timestamp
}

/* ------------------------------------------------------------------------ */
/*  Item descriptions (Spanish, taken from the static knowledge base)       */
/* ------------------------------------------------------------------------ */

const MCHAT_ITEMS_ES: string[] = [
  "Si usted señala algo al otro lado de la habitación, ¿su hijo/a lo mira?",
  "¿Alguna vez se ha preguntado si su hijo/a es sordo/a?",
  "¿Su hijo/a juega a imaginar o hacer juegos de ficción?",
  "¿A su hijo/a le gusta subirse a las cosas?",
  "¿Hace movimientos inusuales con sus dedos cerca de sus ojos?",
  "¿Su hijo/a señala con el dedo para pedir algo o pedir ayuda?",
  "¿Su hijo/a señala con un dedo para mostrarle algo interesante?",
  "¿Su hijo/a muestra interés por otros niños?",
  "¿Su hijo/a le muestra cosas acercándolas o levantándolas para que las vea?",
  "¿Su hijo/a responde cuando usted le llama por su nombre?",
  "Cuando usted sonríe a su hijo/a, ¿él o ella también le sonríe?",
  "¿Le molestan a su hijo/a ruidos cotidianos?",
  "¿Su hijo/a camina solo?",
  "¿Su hijo/a le mira a los ojos cuando le habla, juega o lo viste?",
  "¿Su hijo/a imita sus movimientos?",
  "Si usted se gira a ver algo, ¿su hijo/a trata de mirar hacia lo que usted está mirando?",
  "¿Su hijo/a intenta que usted le mire o le preste atención?",
  "¿Su hijo/a le entiende cuando usted le dice que haga algo?",
  "Si algo nuevo pasa, ¿su hijo/a le mira para ver cómo reacciona?",
  "¿Le gustan a su hijo/a los juegos de movimiento?",
]

/* ------------------------------------------------------------------------ */
/*  Style tokens                                                            */
/* ------------------------------------------------------------------------ */

const NAVY = "#1a365d"
const NAVY_LIGHT = "#2c5282"
const TEXT = "#1f2937"
const MUTED = "#6b7280"
const BORDER = "#d1d5db"
const BG_SUBTLE = "#f3f4f6"

const RISK_COLORS = {
  bajo: { bg: "#d1fae5", border: "#a7f3d0", text: "#065f46" },
  medio: { bg: "#fef3c7", border: "#fde68a", text: "#92400e" },
  alto: { bg: "#fee2e2", border: "#fecaca", text: "#991b1b" },
} as const

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 56,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: TEXT,
    lineHeight: 1.45,
  },

  /* Header */
  header: {
    borderBottom: `2pt solid ${NAVY}`,
    paddingBottom: 12,
    marginBottom: 18,
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    color: NAVY,
    letterSpacing: 0.4,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 9.5,
    color: MUTED,
  },
  metaRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaText: { fontSize: 9, color: MUTED },
  disclaimerBadge: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    border: "0.6pt solid #fcd34d",
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 3,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
  },

  /* Sections */
  section: { marginTop: 16 },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  sectionBody: {
    border: `0.6pt solid ${BORDER}`,
    borderRadius: 3,
    padding: 10,
    backgroundColor: "#fcfcfd",
  },

  /* Generic two-column grid */
  fieldRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  fieldLabel: {
    width: 130,
    fontFamily: "Helvetica-Bold",
    color: NAVY_LIGHT,
    fontSize: 9.5,
  },
  fieldValue: { flex: 1, fontSize: 10 },

  /* Concerns list */
  concernItem: {
    flexDirection: "row",
    marginTop: 2,
  },
  concernBullet: {
    width: 10,
    color: NAVY_LIGHT,
    fontFamily: "Helvetica-Bold",
  },
  concernText: { flex: 1 },

  /* Score banner */
  scoreBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 3,
    marginBottom: 8,
  },
  scoreLabel: { fontSize: 9.5, color: MUTED },
  scoreValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    color: NAVY,
  },
  riskBadge: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 3,
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    letterSpacing: 0.5,
  },

  /* Items table */
  itemRow: {
    flexDirection: "row",
    borderBottom: `0.4pt solid ${BORDER}`,
    paddingVertical: 5,
  },
  itemRowLast: {
    flexDirection: "row",
    paddingVertical: 5,
  },
  itemNumber: {
    width: 28,
    fontFamily: "Helvetica-Bold",
    color: NAVY_LIGHT,
  },
  itemDescription: { flex: 1, paddingRight: 8, fontSize: 9.5 },
  itemMark: {
    width: 14,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    color: "#991b1b",
  },

  /* Recommendation */
  recommendationBox: {
    padding: 10,
    borderRadius: 3,
    border: `0.6pt solid ${NAVY}`,
    backgroundColor: BG_SUBTLE,
  },
  recommendationText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    color: NAVY,
    lineHeight: 1.5,
  },

  /* Professional note */
  professionalNote: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.55,
    fontStyle: "italic",
  },

  /* Triangulación */
  triPanel: {
    border: `0.6pt solid ${BORDER}`,
    borderRadius: 3,
    padding: 0,
    overflow: "hidden",
    marginBottom: 8,
  },
  triHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderBottom: `0.6pt solid ${BORDER}`,
  },
  triHeaderTag: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 8,
    letterSpacing: 0.5,
  },
  triHeaderTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: NAVY,
  },
  triBody: {
    padding: 9,
    fontSize: 9.5,
    lineHeight: 1.45,
  },
  triRow: {
    flexDirection: "row",
    paddingVertical: 3,
  },
  triRowFirst: { paddingTop: 0 },
  triRowLabel: {
    width: 90,
    color: NAVY_LIGHT,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  triRowValue: { flex: 1, fontSize: 9.5 },
  markerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 4,
    borderBottom: `0.4pt solid ${BORDER}`,
  },
  markerName: {
    width: 110,
    fontFamily: "Helvetica-Bold",
    color: NAVY_LIGHT,
    fontSize: 9.5,
  },
  markerStatus: {
    width: 70,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  markerObservation: { flex: 1, fontSize: 9, color: TEXT },
  conclusionBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 3,
    border: `0.8pt solid ${NAVY}`,
    backgroundColor: BG_SUBTLE,
  },
  conclusionLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  conclusionText: {
    fontSize: 10,
    color: TEXT,
    lineHeight: 1.5,
  },

  /* Footer */
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTop: `0.6pt solid ${BORDER}`,
    paddingTop: 8,
    fontSize: 8,
    color: MUTED,
    textAlign: "center",
  },
  footerLine: { marginBottom: 2 },
  pageNumber: {
    position: "absolute",
    bottom: 24,
    right: 40,
    fontSize: 8,
    color: MUTED,
  },
})

/* ------------------------------------------------------------------------ */
/*  Helpers                                                                 */
/* ------------------------------------------------------------------------ */

function formatDate(iso: string): string {
  if (!iso) return "—"
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function formatBirthDate(iso: string): string {
  if (!iso) return "—"
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

function sexLabel(sex: string): string {
  if (sex === "M") return "Masculino"
  if (sex === "F") return "Femenino"
  return "Otro"
}

function riskLabel(r: "bajo" | "medio" | "alto"): string {
  return r === "bajo" ? "BAJO" : r === "medio" ? "MEDIO" : "ALTO"
}

const MARKER_LABEL: Record<string, string> = {
  contacto_visual: "Contacto visual",
  respuesta_nombre: "Respuesta al nombre",
  aleteo_manos: "Movimientos repetitivos",
  senalamiento: "Señalamiento",
}

function markerLabel(m: string): string {
  return MARKER_LABEL[m] ?? m.replace(/_/g, " ")
}

const PRESENCE_PALETTE: Record<
  VideoMarkerResult["presencia"],
  { color: string; label: string }
> = {
  presente: { color: "#065f46", label: "Presente" },
  inconsistente: { color: "#92400e", label: "Inconsistente" },
  ausente: { color: "#991b1b", label: "Ausente" },
  no_evaluable: { color: MUTED, label: "No evaluable" },
}

const QUALITY_LABEL: Record<
  NonNullable<ReportData["videoAnalysis"]>["calidadVideo"],
  string
> = {
  buena: "Buena",
  aceptable: "Aceptable",
  baja: "Baja",
}

/**
 * Compose the "balanced conclusion" paragraph that the pediatrician will
 * read first in the triangulation section. The function is intentionally
 * deterministic so the language stays auditable and never claims a
 * diagnosis. Logic:
 *
 *  - If the M-CHAT (or Follow-Up) is positive AND the video confirms
 *    absent/inconsistent markers: reinforce the recommendation to seek
 *    professional evaluation.
 *  - If the M-CHAT is low (0–2) but red-flag milestones are unchecked
 *    OR caregiver concerns exist AND the video shows mostly present
 *    markers: present the discrepancy as reassuring without dismissing
 *    the caregiver's concern.
 *  - If the M-CHAT is low and the video shows absent markers: flag the
 *    discrepancy and recommend pediatric evaluation without naming
 *    autism.
 *  - Default: neutral synthesis pointing to the next clinical step.
 */
function buildTriangulationConclusion(data: ReportData): string {
  const { mchat, followUp, videoAnalysis, developmentalContext } = data
  const hasVideo = !!videoAnalysis && videoAnalysis.resultados.length > 0
  const evaluables = (videoAnalysis?.resultados ?? []).filter(
    (r) => r.presencia !== "no_evaluable",
  )
  const ausenteCount = evaluables.filter(
    (r) => r.presencia === "ausente",
  ).length
  const presenteCount = evaluables.filter(
    (r) => r.presencia === "presente",
  ).length
  const followUpPositive = followUp?.resultado === "positivo"
  const subjetivoAlto =
    mchat.riesgo === "alto" ||
    (mchat.riesgo === "medio" && followUpPositive)

  const subjetivoBajoConPreocupacion =
    mchat.riesgo === "bajo" &&
    (data.child.concerns.length > 0 ||
      (developmentalContext?.redFlagMilestonesUnchecked.length ?? 0) > 0)

  if (subjetivoAlto && hasVideo && ausenteCount > presenteCount) {
    return "Tanto los datos reportados por el cuidador como la observación objetiva por video muestran señales coincidentes de riesgo. Se recomienda priorizar una evaluación pediátrica del desarrollo para una valoración integral."
  }

  if (subjetivoBajoConPreocupacion && hasVideo && ausenteCount === 0 && presenteCount > 0) {
    return "El cuestionario M-CHAT-R/F arroja riesgo bajo y la observación objetiva por video muestra los marcadores conductuales clave presentes. Las preocupaciones reportadas por el cuidador pueden enmarcarse en variabilidad típica del desarrollo, sin que ello reemplace el seguimiento pediátrico habitual."
  }

  if (subjetivoBajoConPreocupacion && hasVideo && ausenteCount > 0) {
    return "Aunque el cuestionario M-CHAT-R/F clasifica el riesgo como bajo, la observación objetiva por video y las preocupaciones del cuidador apuntan a marcadores conductuales que merecen seguimiento. Se sugiere una evaluación pediátrica del desarrollo para precisar el cuadro y descartar áreas de retraso."
  }

  if (subjetivoAlto && !hasVideo) {
    return "Los datos del cribado indican señales de riesgo. Se recomienda completar la valoración con observación directa por un profesional y, si es posible, aportar un video breve del niño/a para enriquecer la triangulación."
  }

  if (mchat.riesgo === "bajo" && !subjetivoBajoConPreocupacion && !hasVideo) {
    return "El cribado no muestra señales de riesgo significativas en este momento. Se recomienda continuar con el seguimiento pediátrico habitual y repetir el cribado si surgen nuevas preocupaciones."
  }

  return "Los datos disponibles requieren integración clínica. Se sugiere una consulta pediátrica del desarrollo donde se contraste este informe con la exploración directa del niño/a."
}

/* ------------------------------------------------------------------------ */
/*  Document                                                                */
/* ------------------------------------------------------------------------ */

export function MiraReportDocument({ data }: { data: ReportData }) {
  const { child, mchat, followUp, videoAnalysis, developmentalContext, date } = data
  const risk = RISK_COLORS[mchat.riesgo]

  // Section numbering is dynamic because Follow-Up and Triangulation
  // are both optional. We compute labels once so each section header
  // and the page footer agree.
  let n = 2 // sections start at 2 (1 = child data)
  const sectionMchat = ++n - 1 // 2
  const sectionFollowUp = followUp ? ++n - 1 : null
  const hasTriangulation =
    !!videoAnalysis ||
    (developmentalContext?.redFlagMilestonesUnchecked.length ?? 0) > 0
  const sectionTriangulation = hasTriangulation ? ++n - 1 : null
  const sectionRecommendation = ++n - 1
  const sectionProfessionalNote = ++n - 1
  // Suppress unused-var warning while keeping the numbering self-documenting.
  void sectionMchat
  const conclusionText = buildTriangulationConclusion(data)

  return (
    <Document
      title={`Informe MIRA — ${child.alias}`}
      author="MIRA"
      subject="Cribado del desarrollo infantil (M-CHAT-R/F)"
      creator="MIRA"
      producer="MIRA"
    >
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>
            INFORME DE CRIBADO DEL DESARROLLO INFANTIL
          </Text>
          <Text style={styles.subtitle}>
            Generado por MIRA — Monitoreo e Intervención de Riesgo de Autismo
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              Fecha de generación: {formatDate(date)}
            </Text>
            <Text style={styles.disclaimerBadge}>
              DOCUMENTO DE ORIENTACIÓN — NO ES DIAGNÓSTICO
            </Text>
          </View>
        </View>

        {/* SECCIÓN 1 — Datos del niño */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Datos del niño/a</Text>
          <View style={styles.sectionBody}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Alias / identificador</Text>
              <Text style={styles.fieldValue}>{child.alias || "—"}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Edad</Text>
              <Text style={styles.fieldValue}>{child.ageMonths} meses</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Fecha de nacimiento</Text>
              <Text style={styles.fieldValue}>
                {formatBirthDate(child.birthDate)}
              </Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Sexo</Text>
              <Text style={styles.fieldValue}>{sexLabel(child.sex)}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Cuidador responsable</Text>
              <Text style={styles.fieldValue}>{child.guardian || "—"}</Text>
            </View>
            <View style={[styles.fieldRow, { marginTop: 6, alignItems: "flex-start" }]}>
              <Text style={styles.fieldLabel}>Preocupaciones</Text>
              <View style={{ flex: 1 }}>
                {child.concerns.length === 0 ? (
                  <Text style={styles.fieldValue}>
                    No se reportaron preocupaciones específicas.
                  </Text>
                ) : (
                  child.concerns.map((c, i) => (
                    <View key={i} style={styles.concernItem}>
                      <Text style={styles.concernBullet}>•</Text>
                      <Text style={styles.concernText}>{c}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
        </View>

        {/* SECCIÓN 2 — Resultado M-CHAT-R/F (Stage 1) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            2. Resultado M-CHAT-R/F · Etapa 1
          </Text>
          <View style={styles.sectionBody}>
            <View
              style={[
                styles.scoreBanner,
                {
                  backgroundColor: risk.bg,
                  border: `0.6pt solid ${risk.border}`,
                },
              ]}
            >
              <View>
                <Text style={styles.scoreLabel}>PUNTUACIÓN</Text>
                <Text style={styles.scoreValue}>{mchat.score} / 20</Text>
              </View>
              <Text
                style={[
                  styles.riskBadge,
                  {
                    backgroundColor: risk.text,
                    color: "#ffffff",
                  },
                ]}
              >
                RIESGO {riskLabel(mchat.riesgo)}
              </Text>
            </View>

            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 9.5,
                color: NAVY,
                marginTop: 6,
                marginBottom: 4,
              }}
            >
              ÍTEMS MARCADOS EN RIESGO
            </Text>
            {mchat.itemsEnRiesgo.length === 0 ? (
              <Text style={{ fontSize: 9.5, color: MUTED }}>
                Ningún ítem fue marcado en riesgo.
              </Text>
            ) : (
              mchat.itemsEnRiesgo.map((n, idx) => {
                const isLast = idx === mchat.itemsEnRiesgo.length - 1
                const desc = MCHAT_ITEMS_ES[n - 1] ?? `Ítem ${n}`
                return (
                  <View key={n} style={isLast ? styles.itemRowLast : styles.itemRow}>
                    <Text style={styles.itemNumber}>{n}</Text>
                    <Text style={styles.itemDescription}>{desc}</Text>
                    <Text style={styles.itemMark}>X</Text>
                  </View>
                )
              })
            )}
          </View>
        </View>

        {/* SECCIÓN — Follow-Up (si aplica) */}
        {followUp && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {sectionFollowUp}. Resultado Follow-Up · Etapa 2
            </Text>
            <View style={styles.sectionBody}>
              <View
                style={[
                  styles.scoreBanner,
                  {
                    backgroundColor:
                      followUp.resultado === "positivo"
                        ? RISK_COLORS.alto.bg
                        : RISK_COLORS.bajo.bg,
                    border: `0.6pt solid ${
                      followUp.resultado === "positivo"
                        ? RISK_COLORS.alto.border
                        : RISK_COLORS.bajo.border
                    }`,
                  },
                ]}
              >
                <View>
                  <Text style={styles.scoreLabel}>ÍTEMS QUE PERSISTEN</Text>
                  <Text style={styles.scoreValue}>
                    {followUp.score}{" "}
                    <Text style={{ fontFamily: "Helvetica", fontSize: 10, color: MUTED }}>
                      (corte ≥ 2)
                    </Text>
                  </Text>
                </View>
                <Text
                  style={[
                    styles.riskBadge,
                    {
                      backgroundColor:
                        followUp.resultado === "positivo"
                          ? RISK_COLORS.alto.text
                          : RISK_COLORS.bajo.text,
                      color: "#ffffff",
                    },
                  ]}
                >
                  {followUp.resultado === "positivo" ? "POSITIVO" : "NEGATIVO"}
                </Text>
              </View>

              {followUp.itemsFallados.length > 0 && (
                <>
                  <Text
                    style={{
                      fontFamily: "Helvetica-Bold",
                      fontSize: 9.5,
                      color: NAVY,
                      marginTop: 6,
                      marginBottom: 4,
                    }}
                  >
                    ÍTEMS QUE PERSISTEN TRAS LA CLARIFICACIÓN
                  </Text>
                  {followUp.itemsFallados.map((n, idx) => {
                    const isLast = idx === followUp.itemsFallados.length - 1
                    const desc = MCHAT_ITEMS_ES[n - 1] ?? `Ítem ${n}`
                    return (
                      <View
                        key={n}
                        style={isLast ? styles.itemRowLast : styles.itemRow}
                      >
                        <Text style={styles.itemNumber}>{n}</Text>
                        <Text style={styles.itemDescription}>{desc}</Text>
                        <Text style={styles.itemMark}>X</Text>
                      </View>
                    )
                  })}
                </>
              )}
            </View>
          </View>
        )}

        {/* SECCIÓN — Triangulación clínica (si hay video o banderas rojas) */}
        {hasTriangulation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {sectionTriangulation}. Triangulación clínica
            </Text>

            {/* SUBJETIVO — datos del cuidador */}
            <View style={styles.triPanel}>
              <View style={styles.triHeaderRow}>
                <Text
                  style={[
                    styles.triHeaderTag,
                    { backgroundColor: NAVY_LIGHT, color: "#ffffff" },
                  ]}
                >
                  SUBJETIVO
                </Text>
                <Text style={styles.triHeaderTitle}>
                  Reporte del cuidador y cribado M-CHAT-R/F
                </Text>
              </View>
              <View style={styles.triBody}>
                <View style={[styles.triRow, styles.triRowFirst]}>
                  <Text style={styles.triRowLabel}>Puntaje M-CHAT</Text>
                  <Text style={styles.triRowValue}>
                    {mchat.score} / 20 — riesgo {riskLabel(mchat.riesgo)}
                    {followUp
                      ? ` · Follow-Up: ${
                          followUp.resultado === "positivo"
                            ? "POSITIVO"
                            : "NEGATIVO"
                        }`
                      : ""}
                  </Text>
                </View>
                <View style={styles.triRow}>
                  <Text style={styles.triRowLabel}>Preocupaciones</Text>
                  <View style={{ flex: 1 }}>
                    {child.concerns.length === 0 ? (
                      <Text style={styles.triRowValue}>
                        No se reportaron preocupaciones específicas.
                      </Text>
                    ) : (
                      child.concerns.map((c, i) => (
                        <View key={i} style={styles.concernItem}>
                          <Text style={styles.concernBullet}>•</Text>
                          <Text style={styles.concernText}>{c}</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
                {developmentalContext &&
                  developmentalContext.redFlagMilestonesUnchecked.length > 0 && (
                    <View style={styles.triRow}>
                      <Text style={styles.triRowLabel}>
                        Hitos no observados
                        {developmentalContext.bucketLabel
                          ? ` (${developmentalContext.bucketLabel})`
                          : ""}
                      </Text>
                      <View style={{ flex: 1 }}>
                        {developmentalContext.redFlagMilestonesUnchecked.map(
                          (m, i) => (
                            <View key={i} style={styles.concernItem}>
                              <Text style={styles.concernBullet}>•</Text>
                              <Text style={styles.concernText}>{m}</Text>
                            </View>
                          ),
                        )}
                      </View>
                    </View>
                  )}
              </View>
            </View>

            {/* OBJETIVO — análisis IA del video */}
            {videoAnalysis ? (
              <View style={styles.triPanel}>
                <View style={styles.triHeaderRow}>
                  <Text
                    style={[
                      styles.triHeaderTag,
                      { backgroundColor: "#0f766e", color: "#ffffff" },
                    ]}
                  >
                    OBJETIVO
                  </Text>
                  <Text style={styles.triHeaderTitle}>
                    Observación por video (análisis asistido por IA)
                  </Text>
                </View>
                <View style={styles.triBody}>
                  <View style={[styles.triRow, styles.triRowFirst]}>
                    <Text style={styles.triRowLabel}>Duración analizada</Text>
                    <Text style={styles.triRowValue}>
                      {videoAnalysis.duracionSeg} segundos · calidad{" "}
                      {QUALITY_LABEL[videoAnalysis.calidadVideo]}
                    </Text>
                  </View>
                  <View style={{ marginTop: 6 }}>
                    {videoAnalysis.resultados.map((r, i) => {
                      const palette = PRESENCE_PALETTE[r.presencia]
                      const isLast =
                        i === videoAnalysis.resultados.length - 1
                      return (
                        <View
                          key={i}
                          style={[
                            styles.markerRow,
                            isLast ? { borderBottom: 0 } : {},
                          ]}
                        >
                          <Text style={styles.markerName}>
                            {markerLabel(r.marcador)}
                          </Text>
                          <Text
                            style={[styles.markerStatus, { color: palette.color }]}
                          >
                            {palette.label}
                          </Text>
                          <Text style={styles.markerObservation}>
                            {r.observacion}
                            {r.confianza > 0
                              ? ` (confianza ${Math.round(r.confianza * 100)}%)`
                              : ""}
                          </Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.triPanel}>
                <View style={styles.triHeaderRow}>
                  <Text
                    style={[
                      styles.triHeaderTag,
                      { backgroundColor: BORDER, color: TEXT },
                    ]}
                  >
                    OBJETIVO
                  </Text>
                  <Text style={styles.triHeaderTitle}>
                    Observación por video — no aportada
                  </Text>
                </View>
                <View style={styles.triBody}>
                  <Text style={styles.triRowValue}>
                    En esta sesión no se aportó un video para análisis. Se
                    recomienda al pediatra registrar observación clínica
                    directa al recibir este informe.
                  </Text>
                </View>
              </View>
            )}

            {/* CONCLUSIÓN EQUILIBRADA */}
            <View style={styles.conclusionBox}>
              <Text style={styles.conclusionLabel}>
                Conclusión equilibrada
              </Text>
              <Text style={styles.conclusionText}>{conclusionText}</Text>
            </View>
          </View>
        )}

        {/* SECCIÓN — Recomendación clínica */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {sectionRecommendation}. Recomendación clínica
          </Text>
          <View style={styles.recommendationBox}>
            <Text style={styles.recommendationText}>{mchat.recomendacion}</Text>
          </View>
        </View>

        {/* SECCIÓN — Nota para el profesional */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {sectionProfessionalNote}. Nota para el profesional
          </Text>
          <View style={styles.sectionBody}>
            <Text style={styles.professionalNote}>
              Este informe fue generado mediante el cuestionario M-CHAT-R/F
              (Modified Checklist for Autism in Toddlers, Revised with
              Follow-Up), un instrumento de cribado validado para niños de 16
              a 30 meses (Robins et al., 2014). La sensibilidad del M-CHAT-R/F
              es de 85.7% y la especificidad de 99.0% cuando se incluye la
              etapa de Follow-Up. Este documento no constituye un diagnóstico.
              Se sugiere considerar los resultados como punto de partida para
              una evaluación clínica integral.
            </Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerLine}>
            M-CHAT-R/F (TM) (C) 2009 Diana L. Robins, Deborah Fein y Marianne
            Barton — Referencia: mchatscreen.com
          </Text>
          <Text>MIRA — Herramienta de cribado, no de diagnóstico</Text>
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  )
}
