import { describe, it, expect, beforeAll } from "vitest";
import { trialGuardHash } from "@/lib/billing/trial-guard-hash";

// The pure hash reads the secret from env at call time.
beforeAll(() => {
  process.env.TRIAL_GUARD_HMAC_SECRET = "test-secret-do-not-use-in-prod";
});

describe("trialGuardHash — pseudonymised, normalised, deterministic", () => {
  it("is deterministic for the same normalised email", () => {
    expect(trialGuardHash("user@example.com")).toBe(trialGuardHash("user@example.com"));
  });

  it("returns a 64-char hex digest and never the plaintext email", () => {
    const h = trialGuardHash("user@example.com")!;
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain("user@example.com");
    expect(h).not.toContain("example.com");
  });

  it("collapses Gmail dots + aliases to the SAME token", () => {
    const a = trialGuardHash("John.Doe+promo@gmail.com");
    const b = trialGuardHash("johndoe@gmail.com");
    expect(a).toBe(b);
  });

  it("case/whitespace-insensitive", () => {
    expect(trialGuardHash("  User@Example.COM ")).toBe(trialGuardHash("user@example.com"));
  });

  it("does NOT strip dots for non-Gmail domains (dots are significant there)", () => {
    const a = trialGuardHash("john.doe@outlook.com");
    const b = trialGuardHash("johndoe@outlook.com");
    expect(a).not.toBe(b);
  });

  it("+alias is still stripped on non-Gmail domains", () => {
    expect(trialGuardHash("jane+news@outlook.com")).toBe(trialGuardHash("jane@outlook.com"));
  });

  it("different people → different tokens", () => {
    expect(trialGuardHash("a@example.com")).not.toBe(trialGuardHash("b@example.com"));
  });

  it("returns null when no secret is configured (fails open)", () => {
    const saved = process.env.TRIAL_GUARD_HMAC_SECRET;
    delete process.env.TRIAL_GUARD_HMAC_SECRET;
    expect(trialGuardHash("user@example.com")).toBeNull();
    process.env.TRIAL_GUARD_HMAC_SECRET = saved;
  });

  it("rotating the secret changes the token (documents the stability caveat)", () => {
    const before = trialGuardHash("user@example.com");
    process.env.TRIAL_GUARD_HMAC_SECRET = "a-different-secret";
    const after = trialGuardHash("user@example.com");
    expect(after).not.toBe(before);
    process.env.TRIAL_GUARD_HMAC_SECRET = "test-secret-do-not-use-in-prod";
  });
});
