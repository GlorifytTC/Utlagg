import { describe, it, expect } from "vitest";
import { userLimitBucket, userLimitKey } from "@/lib/user-rate-limit-policy";
import { checkLimit } from "@/lib/rate-limit";

/**
 * Per-user rate limit applied to every API route by middleware.ts. Policy is
 * pure; the limiter runs on the in-memory backend here (no Upstash in tests),
 * which is also the production fallback.
 */

describe("userLimitBucket", () => {
  it("reads and writes get separate buckets", () => {
    expect(userLimitBucket("/api/receipts", "GET")).toBe("userRead");
    expect(userLimitBucket("/api/receipts", "HEAD")).toBe("userRead");
    for (const m of ["POST", "PUT", "PATCH", "DELETE"]) expect(userLimitBucket("/api/receipts", m)).toBe("userWrite");
  });

  it("covers every API route, not just a few", () => {
    for (const p of ["/api/me", "/api/mileage/bulk", "/api/admin/users", "/api/accountant/boost", "/api/export/sie", "/api/ocr/ai"]) {
      expect(userLimitBucket(p, "POST")).toBe("userWrite");
    }
  });

  it("never throttles webhooks, cron, inbound mail, CSP reports, health or NextAuth", () => {
    for (const p of [
      "/api/webhooks/stripe",
      "/api/cron/reset-scans",
      "/api/inbound/email",
      "/api/csp-report",
      "/api/health",
      "/api/auth/session",
      "/api/auth/callback/credentials",
    ]) {
      expect(userLimitBucket(p, "POST")).toBeNull();
    }
  });

  it("ignores pages, assets and CORS preflight", () => {
    expect(userLimitBucket("/dashboard", "GET")).toBeNull();
    expect(userLimitBucket("/api/receipts", "OPTIONS")).toBeNull();
    // Prefix lookalikes are still limited.
    expect(userLimitBucket("/api/healthz-admin", "GET")).toBe("userRead");
    expect(userLimitBucket("/api/inbound/address", "GET")).toBe("userRead");
  });
});

describe("userLimitKey", () => {
  it("keys by user when signed in, by IP otherwise", () => {
    expect(userLimitKey("abc", "1.2.3.4")).toBe("u:abc");
    expect(userLimitKey(null, "1.2.3.4")).toBe("ip:1.2.3.4");
    expect(userLimitKey(undefined, null)).toBe("ip:anonymous");
  });
});

describe("per-user limiter", () => {
  it("allows 60 writes a minute per user, then blocks; other users unaffected", async () => {
    const me = userLimitKey(`w-${Date.now()}`, null);
    const other = userLimitKey(`o-${Date.now()}`, null);
    for (let i = 0; i < 60; i++) expect(await checkLimit("userWrite", me)).toBe(true);
    expect(await checkLimit("userWrite", me)).toBe(false);
    expect(await checkLimit("userWrite", other)).toBe(true);
  });

  it("allows 300 reads a minute per user, then blocks", async () => {
    const me = userLimitKey(`r-${Date.now()}`, null);
    for (let i = 0; i < 300; i++) expect(await checkLimit("userRead", me)).toBe(true);
    expect(await checkLimit("userRead", me)).toBe(false);
  });
});
