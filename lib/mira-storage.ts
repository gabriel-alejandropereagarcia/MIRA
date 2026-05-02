/**
 * MIRA local persistence layer.
 *
 * All data lives client-side in `localStorage` — nothing touches a server.
 * This keeps the privacy surface minimal for a screening tool dealing with
 * pediatric information. Each helper is SSR-safe: on the server
 * `localStorage` is undefined, so the getters return empty values and the
 * setters silently no-op.
 */

const PROFILE_KEY = "mira_profiles"
const EVAL_KEY = "mira_evaluations"

export type Sex = "M" | "F" | "otro"

export interface ChildProfile {
  id: string
  alias: string
  birthDate: string // ISO `YYYY-MM-DD`
  ageMonths: number
  sex: Sex
  guardian: string
  concerns: string[]
  locale: "es" | "en" // Added for bilingue support
  createdAt: string // ISO timestamp
}

export interface EvaluationRecord {
  id: string
  childId: string
  date: string // ISO timestamp
  mchatScore?: number
  mchatRiesgo?: "bajo" | "medio" | "alto"
  mchatItemsEnRiesgo?: number[]
  followUpScore?: number
  followUpResult?: "positivo" | "negativo"
}

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function readJSON<T>(key: string, fallback: T): T {
  if (!hasWindow()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch (err) {
    console.log("[v0] mira-storage: failed to read", key, (err as Error).message)
    return fallback
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (!hasWindow()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.log("[v0] mira-storage: failed to write", key, (err as Error).message)
  }
}

/**
 * Computes age in whole months between a birth date and today.
 * Always >= 0. Handles the common case of the birth day not yet
 * reached in the current month.
 */
export function ageInMonths(birthDate: string, ref: Date = new Date()): number {
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return 0
  let months =
    (ref.getFullYear() - birth.getFullYear()) * 12 +
    (ref.getMonth() - birth.getMonth())
  if (ref.getDate() < birth.getDate()) months -= 1
  return Math.max(0, months)
}

/* ----------------------------- Profiles ------------------------------ */

export function getProfiles(): ChildProfile[] {
  return readJSON<ChildProfile[]>(PROFILE_KEY, [])
}

export function getProfile(id: string): ChildProfile | null {
  return getProfiles().find((p) => p.id === id) ?? null
}

export function saveProfile(profile: ChildProfile): void {
  const all = getProfiles()
  const idx = all.findIndex((p) => p.id === profile.id)
  if (idx === -1) all.push(profile)
  else all[idx] = profile
  writeJSON(PROFILE_KEY, all)
}

/* --------------------------- Evaluations ----------------------------- */

export function getEvaluations(childId: string): EvaluationRecord[] {
  return readJSON<EvaluationRecord[]>(EVAL_KEY, []).filter(
    (e) => e.childId === childId,
  )
}

export function saveEvaluation(evaluation: EvaluationRecord): void {
  const all = readJSON<EvaluationRecord[]>(EVAL_KEY, [])
  const idx = all.findIndex((e) => e.id === evaluation.id)
  if (idx === -1) all.push(evaluation)
  else all[idx] = evaluation
  writeJSON(EVAL_KEY, all)
}
