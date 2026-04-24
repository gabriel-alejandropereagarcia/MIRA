/**
 * Gemini Context Cache manager for MIRA.
 *
 * Strategy:
 *  - On first chat request (cold start), call Google's CachedContent API
 *    to upload MIRA_STATIC_KNOWLEDGE_BASE with a TTL.
 *  - Store the returned cache name in a module-scoped singleton so every
 *    subsequent request in the same serverless container reuses it.
 *  - If creation fails (missing API key, below minimum token threshold,
 *    quota, etc.) we log and return null — the caller falls back to
 *    sending the static block inline as part of `system`.
 *
 * Notes:
 *  - The Vercel AI SDK Google provider CONSUMES a cache via
 *    `providerOptions.google.cachedContent`, but does not manage cache
 *    lifecycle. That's why we use `@google/generative-ai`'s
 *    GoogleAICacheManager directly for creation.
 *  - Minimum token thresholds apply (gemini-2.5-flash: 4,096 tokens for
 *    explicit caching). Our static block is dimensioned to comfortably
 *    cross that minimum.
 */
import { GoogleAICacheManager } from "@google/generative-ai/server"
import { MIRA_STATIC_KNOWLEDGE_BASE } from "./mira-static-knowledge"

// Keep the model id in ONE place so you can swap it in a single edit.
// NOTE: gemini-1.5-flash was retired by Google in Sept 2025; gemini-2.5-flash
// is the current supported equivalent with better cache economics.
export const GOOGLE_MODEL = process.env.GOOGLE_MODEL ?? "gemini-2.5-flash"

// How long the cache should live on Google's side (in seconds).
// 1 hour is a reasonable default: long enough to amortize creation cost
// across a user session, short enough to keep storage charges small.
const CACHE_TTL_SECONDS = 60 * 60

type CacheEntry = {
  name: string // e.g. "cachedContents/abc123"
  createdAt: number // ms since epoch
  expiresAt: number // ms since epoch
}

let cached: CacheEntry | null = null
let inflight: Promise<CacheEntry | null> | null = null

/**
 * Returns the cache resource name if creation succeeds, or null if we
 * should fall back to inlining the static block.
 */
export async function getMiraKnowledgeCache(): Promise<string | null> {
  // Still valid — reuse.
  if (cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.name
  }

  // Creation in progress — join the same promise.
  if (inflight) return inflight

  inflight = createCache()
    .then((entry) => {
      cached = entry
      return entry?.name ?? null
    })
    .catch((err) => {
      console.log("[v0] gemini-cache: creation failed, will fall back", err?.message)
      cached = null
      return null
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

async function createCache(): Promise<CacheEntry | null> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    console.log("[v0] gemini-cache: GOOGLE_GENERATIVE_AI_API_KEY missing; skipping cache")
    return null
  }

  const cacheManager = new GoogleAICacheManager(apiKey)

  // Gemini's cache API expects the full model path "models/<id>".
  const modelPath = GOOGLE_MODEL.startsWith("models/")
    ? GOOGLE_MODEL
    : `models/${GOOGLE_MODEL}`

  try {
    const result = await cacheManager.create({
      model: modelPath,
      displayName: "mira-static-knowledge-v1",
      contents: [
        {
          role: "user",
          parts: [{ text: MIRA_STATIC_KNOWLEDGE_BASE }],
        },
      ],
      ttlSeconds: CACHE_TTL_SECONDS,
    })

    const name = result.name
    if (!name) {
      console.log("[v0] gemini-cache: create returned no name")
      return null
    }

    const createdAt = Date.now()
    const entry: CacheEntry = {
      name,
      createdAt,
      expiresAt: createdAt + CACHE_TTL_SECONDS * 1000,
    }
    console.log("[v0] gemini-cache: created", name, "ttl", CACHE_TTL_SECONDS, "s")
    return entry
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // The most common expected failure is the minimum-token threshold
    // (<4,096 tokens on gemini-2.5-flash, <32,768 on 1.5-flash). In that
    // case we silently fall back to inline so the app still works.
    console.log("[v0] gemini-cache: create error:", msg)
    return null
  }
}

/**
 * Force-invalidate the in-memory cache handle. Useful if you redeploy
 * new static knowledge and want the next request to recreate.
 */
export function resetMiraKnowledgeCache() {
  cached = null
  inflight = null
}
