import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Sliding-window rate limiting backed by Upstash Redis.
 *
 * Degrades gracefully: if UPSTASH_REDIS_REST_URL/TOKEN are not set (or are a
 * placeholder / non-https value), limiting is disabled (the app still runs)
 * rather than crashing every wrapped route. The https check matters at build
 * time: Redis.fromEnv() throws on an invalid URL, which fails `next build`.
 */
const upstashConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL?.startsWith("https://") &&
    process.env.UPSTASH_REDIS_REST_TOKEN,
);

// Fail LOUD in production: a missing Upstash config silently disables every
// rate limit (login brute force, register/OCR abuse). Surface it in logs so a
// misconfigured deploy is visible instead of quietly unprotected.
if (!upstashConfigured && process.env.NODE_ENV === "production") {
  console.error(
    "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set in production — " +
      "ALL rate limiting is DISABLED (auth, register, OCR). Configure Upstash.",
  );
}

let limiter: Ratelimit | null = null;

if (upstashConfigured) {
  limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
    prefix: "kvitto",
  });
}

function ipFrom(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

/**
 * Returns a 429 NextResponse if the caller is over the limit, otherwise null.
 *
 * Usage inside a route handler:
 *   const limited = await enforceRateLimit(req, "ocr");
 *   if (limited) return limited;
 */
export async function enforceRateLimit(
  req: NextRequest,
  bucket: string,
  identifier?: string,
): Promise<NextResponse | null> {
  if (!limiter) return null; // disabled when Upstash isn't configured
  const id = identifier ?? ipFrom(req);
  const { success, limit, remaining, reset } = await limiter.limit(
    `${bucket}:${id}`,
  );
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

export const rateLimitEnabled = () => limiter !== null;

/**
 * Named limiters for specific routes. Each is null when Upstash isn't
 * configured; checkLimit() then allows the request (fail-open in dev).
 */
function make(tokens: number, window: Parameters<typeof Ratelimit.slidingWindow>[1]) {
  if (!upstashConfigured) {
    return null;
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(tokens, window),
    analytics: true,
    prefix: "kvitto",
  });
}

export const rateLimit = {
  upload: make(10, "10 s"),
  api: make(30, "1 m"),
  auth: make(5, "1 m"),
};

/**
 * Check a named bucket for an identifier. Returns true if allowed.
 * Fail-open when the bucket is null (Upstash not configured).
 */
export async function checkLimit(
  bucket: keyof typeof rateLimit,
  identifier: string,
): Promise<boolean> {
  const rl = rateLimit[bucket];
  if (!rl) return true;
  const { success } = await rl.limit(identifier);
  return success;
}
