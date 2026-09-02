import { Redis } from "@upstash/redis";

/**
 * Single-use OAuth `state` storage for CSRF protection on redirect callbacks.
 *
 * On auth start we persist `state -> userId` with a short TTL; on callback we
 * atomically read-and-delete it (GETDEL) so a state can be redeemed exactly
 * once and only by the user who started the flow. Backed by the same Upstash
 * Redis the rate limiter uses.
 *
 * Degrades gracefully: when Upstash isn't configured, `oauthStateEnabled()` is
 * false and callers fall back to the in-band `userId.`-prefixed state check.
 */
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const TTL_SECONDS = 600; // 10 min — an OAuth consent round-trip is far shorter.
const key = (state: string) => `oauth_state:${state}`;

export const oauthStateEnabled = () => redis !== null;

export async function saveOAuthState(state: string, userId: string): Promise<void> {
  if (redis) await redis.set(key(state), userId, { ex: TTL_SECONDS });
}

/** Returns the bound userId and consumes the state, or null if absent/expired. */
export async function consumeOAuthState(state: string): Promise<string | null> {
  if (!redis) return null;
  return (await redis.getdel(key(state))) as string | null;
}
