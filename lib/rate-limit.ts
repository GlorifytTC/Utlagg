import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Sliding-window rate limiting backed by Upstash Redis.
 *
 * Degrades gracefully: if UPSTASH_REDIS_REST_URL/TOKEN are not set, limiting is
 * disabled (the app still runs) rather than crashing every wrapped route.
 */
let limiter: Ratelimit | null = null;

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
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
