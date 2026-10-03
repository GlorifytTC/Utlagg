import { describe, it, expect } from "vitest";
import { checkLimit, rateLimitEnabled } from "@/lib/rate-limit";

/**
 * In the test environment UPSTASH_* is not configured, so these exercise the
 * in-memory fallback. The point: rate limiting must NEVER fail open - a flood
 * is throttled even without Upstash.
 */
describe("rate limiting fails closed without Upstash (in-memory fallback)", () => {
  it("reports limiting as enabled even with no Upstash", () => {
    expect(rateLimitEnabled()).toBe(true);
  });

  it("allows up to the auth budget (5/min) then blocks further attempts", async () => {
    const id = `test-auth-${Date.now()}-${Math.random()}`;
    const results: boolean[] = [];
    for (let i = 0; i < 7; i++) {
      results.push(await checkLimit("auth", id));
    }
    // First 5 allowed, the rest blocked within the same window.
    expect(results.slice(0, 5)).toEqual([true, true, true, true, true]);
    expect(results[5]).toBe(false);
    expect(results[6]).toBe(false);
  });

  it("keeps separate counters per identifier", async () => {
    const a = `test-a-${Date.now()}-${Math.random()}`;
    const b = `test-b-${Date.now()}-${Math.random()}`;
    for (let i = 0; i < 5; i++) await checkLimit("auth", a);
    // a is now exhausted, but b is untouched.
    expect(await checkLimit("auth", a)).toBe(false);
    expect(await checkLimit("auth", b)).toBe(true);
  });

  it("api bucket has a higher budget than auth", async () => {
    const id = `test-api-${Date.now()}-${Math.random()}`;
    let allowed = 0;
    for (let i = 0; i < 30; i++) {
      if (await checkLimit("api", id)) allowed++;
    }
    expect(allowed).toBe(30);
    expect(await checkLimit("api", id)).toBe(false);
  });
});
