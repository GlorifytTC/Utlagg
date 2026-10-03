import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Sliding-window rate limiting.
 *
 * Primary backend is Upstash Redis (distributed, authoritative across all
 * serverless instances). When Upstash is not configured we DO NOT fail open:
 * an in-memory sliding-window limiter takes over so auth/register/OCR are still
 * throttled. The in-memory limiter is per-instance (it resets on cold start and
 * is not shared between instances), so it is weaker than Redis, but it never
 * leaves a route completely unprotected and never locks a legitimate user out.
 *
 * The https check matters at build time: Redis.fromEnv() throws on an invalid
 * URL, which would fail `next build`.
 */
const upstashConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL?.startsWith("https://") &&
    process.env.UPSTASH_REDIS_REST_TOKEN,
);

if (!upstashConfigured && process.env.NODE_ENV === "production") {
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set in production - " +
      "falling back to the in-memory limiter (per-instance, not shared). " +
      "Configure Upstash for distributed rate limiting.",
  );
}

/** Named bucket limits for checkLimit(), used by both backends. */
const BUCKETS = {
  upload: { tokens: 10, windowMs: 10_000 },
  api: { tokens: 30, windowMs: 60_000 },
  auth: { tokens: 5, windowMs: 60_000 },
} as const;
type BucketName = keyof typeof BUCKETS;

/**
 * Default limit for enforceRateLimit(), whose bucket argument is a free-form
 * key prefix (e.g. "firm-invite") rather than a named bucket. Matches the
 * original general limiter: 10 requests / 10 s.
 */
const GENERAL = { tokens: 10, windowMs: 10_000 } as const;

/* ------------------------------------------------------------------ */
/* In-memory sliding-window fallback                                   */
/* ------------------------------------------------------------------ */

const memStore = new Map<string, number[]>();
let lastSweep = 0;

/** Drop keys whose newest hit is older than the longest window, to bound memory. */
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  const maxWindow = 60_000;
  for (const [key, hits] of memStore) {
    if (hits.length === 0 || hits[hits.length - 1] <= now - maxWindow) {
      memStore.delete(key);
    }
  }
  // Hard cap so a flood of distinct keys can't grow the map without bound.
  if (memStore.size > 50_000) memStore.clear();
}

function memAllow(key: string, tokens: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
  const cutoff = now - windowMs;
  const recent = (memStore.get(key) ?? []).filter((t) => t > cutoff);
  if (recent.length >= tokens) {
    memStore.set(key, recent);
    return false;
  }
  recent.push(now);
  memStore.set(key, recent);
  return true;
}

/* ------------------------------------------------------------------ */
/* Upstash limiters (primary)                                          */
/* ------------------------------------------------------------------ */

function make(name: BucketName) {
  if (!upstashConfigured) return null;
  const { tokens, windowMs } = BUCKETS[name];
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(tokens, `${Math.round(windowMs / 1000)} s`),
    analytics: true,
    prefix: "kvitto",
  });
}

export const rateLimit = {
  upload: make("upload"),
  api: make("api"),
  auth: make("auth"),
};

/** General limiter for enforceRateLimit (free-form bucket prefixes). */
const generalLimiter = upstashConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(GENERAL.tokens, `${Math.round(GENERAL.windowMs / 1000)} s`),
      analytics: true,
      prefix: "kvitto",
    })
  : null;

function ipFrom(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

/**
 * Returns a 429 NextResponse if the caller is over the limit, otherwise null.
 * Uses Upstash when configured, the in-memory fallback otherwise (never open).
 *
 *   const limited = await enforceRateLimit(req, "api");
 *   if (limited) return limited;
 */
export async function enforceRateLimit(
  req: NextRequest,
  bucket: string,
  identifier?: string,
): Promise<NextResponse | null> {
  const id = identifier ?? ipFrom(req);
  const key = `${bucket}:${id}`;

  if (generalLimiter) {
    const { success, limit, remaining, reset } = await generalLimiter.limit(key);
    if (success) return null;
    return NextResponse.json(
      { error: "För många förfrågningar. Försök igen snart." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.max(0, Math.ceil((reset - Date.now()) / 1000)).toString(),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
        },
      },
    );
  }

  // Fallback: in-memory sliding window (never fails open).
  if (memAllow(key, GENERAL.tokens, GENERAL.windowMs)) return null;
  return NextResponse.json(
    { error: "För många förfrågningar. Försök igen snart." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(GENERAL.windowMs / 1000)) },
    },
  );
}

export const rateLimitEnabled = () => true;

/**
 * Check a named bucket for an identifier. Returns true if allowed.
 * Never fails open: Upstash when configured, in-memory fallback otherwise.
 */
export async function checkLimit(
  bucket: BucketName,
  identifier: string,
): Promise<boolean> {
  const rl = rateLimit[bucket];
  if (rl) {
    const { success } = await rl.limit(identifier);
    return success;
  }
  const { tokens, windowMs } = BUCKETS[bucket];
  return memAllow(`${bucket}:${identifier}`, tokens, windowMs);
}
