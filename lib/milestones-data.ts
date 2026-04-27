/**
 * Developmental milestones — based on the CDC's "Learn the Signs. Act Early."
 * checklists (revised 2022). Each milestone belongs to one of four
 * developmental domains and a single CDC age bucket. `isRedFlag = true`
 * marks milestones whose ABSENCE at the given age is a recognized warning
 * sign (CDC + AAP guidance) and should prompt closer follow-up.
 */

export type MilestoneCategory = "social" | "language" | "cognitive" | "motor"

export interface Milestone {
  id: string
  ageMonths: number
  category: MilestoneCategory
  description_es: string
  description_en: string
  isRedFlag: boolean
}

export const MILESTONES: Milestone[] = [
  // 9 MESES
  {
    id: "9m-1",
    ageMonths: 9,
    category: "social",
    description_es: "Tiene miedo de personas desconocidas",
    description_en: "Is shy or clingy with strangers",
    isRedFlag: false,
  },
  {
    id: "9m-2",
    ageMonths: 9,
    category: "language",
    description_es: "Balbucea con entonación",
    description_en: "Makes different sounds",
    isRedFlag: false,
  },
  {
    id: "9m-3",
    ageMonths: 9,
    category: "cognitive",
    description_es: 'Mira cuando le dicen "no"',
    description_en: 'Looks when you say "no"',
    isRedFlag: false,
  },

  // 12 MESES
  {
    id: "12m-1",
    ageMonths: 12,
    category: "social",
    description_es: '¿Juega "dónde está el bebé?" (peek-a-boo)',
    description_en: "Plays peek-a-boo",
    isRedFlag: false,
  },
  {
    id: "12m-2",
    ageMonths: 12,
    category: "language",
    description_es: 'Dice "mamá" o "papá"',
    description_en: 'Says "mama" or "dada"',
    isRedFlag: true,
  },
  {
    id: "12m-3",
    ageMonths: 12,
    category: "motor",
    description_es: "Se para sosteniéndose",
    description_en: "Pulls up to stand",
    isRedFlag: false,
  },
  {
    id: "12m-4",
    ageMonths: 12,
    category: "cognitive",
    description_es: "Señala para pedir cosas",
    description_en: "Points to ask for things",
    isRedFlag: true,
  },

  // 18 MESES
  {
    id: "18m-1",
    ageMonths: 18,
    category: "social",
    description_es: "Muestra interés en otros niños",
    description_en: "Shows interest in other children",
    isRedFlag: true,
  },
  {
    id: "18m-2",
    ageMonths: 18,
    category: "language",
    description_es: "Dice al menos 3 palabras además de mamá/papá",
    description_en: "Says at least 3 words",
    isRedFlag: true,
  },
  {
    id: "18m-3",
    ageMonths: 18,
    category: "language",
    description_es: "Señala para mostrar algo interesante",
    description_en: "Points to show things",
    isRedFlag: true,
  },
  {
    id: "18m-4",
    ageMonths: 18,
    category: "cognitive",
    description_es: "Imita acciones simples (barrer, hablar por teléfono)",
    description_en: "Copies simple actions",
    isRedFlag: true,
  },
  {
    id: "18m-5",
    ageMonths: 18,
    category: "motor",
    description_es: "Camina solo",
    description_en: "Walks alone",
    isRedFlag: true,
  },

  // 24 MESES
  {
    id: "24m-1",
    ageMonths: 24,
    category: "social",
    description_es: "Nota cuando otros están tristes",
    description_en: "Notices when others are hurt or upset",
    isRedFlag: false,
  },
  {
    id: "24m-2",
    ageMonths: 24,
    category: "language",
    description_es: 'Combina 2 palabras ("más leche", "mamá ven")',
    description_en: "Puts 2 words together",
    isRedFlag: true,
  },
  {
    id: "24m-3",
    ageMonths: 24,
    category: "language",
    description_es: "Señala cosas en un libro cuando se le pregunta",
    description_en: "Points to things in a book",
    isRedFlag: true,
  },
  {
    id: "24m-4",
    ageMonths: 24,
    category: "cognitive",
    description_es: "Juega con más de un juguete a la vez",
    description_en: "Plays with more than one toy at the same time",
    isRedFlag: false,
  },
  {
    id: "24m-5",
    ageMonths: 24,
    category: "motor",
    description_es: "Patea una pelota",
    description_en: "Kicks a ball",
    isRedFlag: false,
  },

  // 30 MESES
  {
    id: "30m-1",
    ageMonths: 30,
    category: "language",
    description_es: "Dice unas 50 palabras",
    description_en: "Says about 50 words",
    isRedFlag: true,
  },
  {
    id: "30m-2",
    ageMonths: 30,
    category: "social",
    description_es: "Juega al lado de otros niños",
    description_en: "Plays next to other children",
    isRedFlag: true,
  },
  {
    id: "30m-3",
    ageMonths: 30,
    category: "cognitive",
    description_es: "Sigue instrucciones de 2 pasos",
    description_en: "Follows 2-step instructions",
    isRedFlag: true,
  },

  // 36 MESES
  {
    id: "36m-1",
    ageMonths: 36,
    category: "social",
    description_es: "Se turna en juegos",
    description_en: "Takes turns in games",
    isRedFlag: true,
  },
  {
    id: "36m-2",
    ageMonths: 36,
    category: "language",
    description_es: "Mantiene una conversación de 2-3 turnos",
    description_en: "Carries on a conversation with 2-3 exchanges",
    isRedFlag: true,
  },
  {
    id: "36m-3",
    ageMonths: 36,
    category: "cognitive",
    description_es: "Juego de imaginación (pretender ser otra persona)",
    description_en: "Pretend play (pretends to be someone else)",
    isRedFlag: true,
  },
]

/**
 * CDC standard age buckets for milestone checklists.
 * Sorted ascending so that floor-to-bucket logic works with `findLast`.
 */
const AGE_BUCKETS = [9, 12, 18, 24, 30, 36] as const

/**
 * Returns all milestones for the most recent CDC age bucket that the child
 * has already reached. Below 9 months we return an empty list (no MIRA
 * milestones tracked yet). Above 36 months we lock onto the 36-month
 * checklist — the highest bucket MIRA covers.
 */
export function getMilestonesForAge(ageMonths: number): Milestone[] {
  if (ageMonths < AGE_BUCKETS[0]) return []
  // Pick the largest bucket ≤ ageMonths.
  const bucket =
    [...AGE_BUCKETS].reverse().find((b) => ageMonths >= b) ?? AGE_BUCKETS[0]
  return MILESTONES.filter((m) => m.ageMonths === bucket)
}

/**
 * Returns the CDC bucket label that matches the child's age, useful for
 * UI labels like "Lista CDC: 18 meses".
 */
export function getMilestoneBucket(ageMonths: number): number | null {
  if (ageMonths < AGE_BUCKETS[0]) return null
  return [...AGE_BUCKETS].reverse().find((b) => ageMonths >= b) ?? null
}

/* ------------------------- Persistence layer ------------------------- */

const STORAGE_KEY = "mira_observed_milestones"

type StoreShape = Record<string, string[]>

function hasWindow(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  )
}

function readStore(): StoreShape {
  if (!hasWindow()) return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoreShape) : {}
  } catch (err) {
    console.log(
      "[v0] milestones-data: failed to read store",
      (err as Error).message,
    )
    return {}
  }
}

function writeStore(store: StoreShape): void {
  if (!hasWindow()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch (err) {
    console.log(
      "[v0] milestones-data: failed to write store",
      (err as Error).message,
    )
  }
}

/** Returns the set of milestone ids the caregiver marked as observed. */
export function getObservedMilestones(childId: string): string[] {
  return readStore()[childId] ?? []
}

/** Persists the full observed-milestones array for a given child. */
export function setObservedMilestones(childId: string, ids: string[]): void {
  const store = readStore()
  store[childId] = ids
  writeStore(store)
}
