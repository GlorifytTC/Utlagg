import { describe, it, expect } from "vitest";
import { resolveAccountState } from "@/lib/billing/access";

const base = {
  subscriptionTier: "pro" as const,
  subscriptionStatus: "active",
  subscriptionPaused: false,
  subscriptionGrantedUntil: null,
  trialEndsAt: null,
  v3Enabled: true,
  now: new Date("2026-06-01T00:00:00Z"),
};

describe("resolveAccountState — Pricing V3 access states", () => {
  it("active paid → active, entitled at its tier", () => {
    const r = resolveAccountState({ ...base, subscriptionTier: "business" });
    expect(r.state).toBe("active");
    expect(r.entitledTier).toBe("business");
  });

  it("active trial → trial, entitled as Pro regardless of post-trial plan", () => {
    const r = resolveAccountState({
      ...base,
      subscriptionTier: "starter", // post-trial plan is Starter
      subscriptionStatus: "trialing",
      trialEndsAt: new Date("2026-06-30T00:00:00Z"),
    });
    expect(r.state).toBe("trial");
    expect(r.entitledTier).toBe("pro"); // full Pro entitlement during the trial
  });

  it("elapsed trial not yet flipped → treated as read-only now", () => {
    const r = resolveAccountState({
      ...base,
      subscriptionStatus: "trialing",
      trialEndsAt: new Date("2026-05-01T00:00:00Z"), // in the past
    });
    expect(r.state).toBe("read_only");
  });

  it("explicit read_only status → read-only", () => {
    const r = resolveAccountState({ ...base, subscriptionStatus: "read_only" });
    expect(r.state).toBe("read_only");
  });

  it("paused → active state but entitled as free (V2 rule preserved)", () => {
    const r = resolveAccountState({ ...base, subscriptionPaused: true });
    expect(r.state).toBe("active");
    expect(r.entitledTier).toBe("free");
  });

  it("expired manual grant → entitled as free", () => {
    const r = resolveAccountState({
      ...base,
      subscriptionGrantedUntil: new Date("2026-05-01T00:00:00Z"),
    });
    expect(r.entitledTier).toBe("free");
  });

  it("V3 disabled ignores trial/read_only specifics (legacy behaviour)", () => {
    const trialing = resolveAccountState({
      ...base,
      subscriptionStatus: "trialing",
      trialEndsAt: new Date("2026-05-01T00:00:00Z"),
      v3Enabled: false,
    });
    // Legacy: no trial/read-only concept → active at its stored tier.
    expect(trialing.state).toBe("active");
    expect(trialing.entitledTier).toBe("pro");

    const readOnly = resolveAccountState({
      ...base,
      subscriptionStatus: "read_only",
      v3Enabled: false,
    });
    expect(readOnly.state).toBe("active");
  });
});

describe("regression — existing paid subscribers pass through unchanged", () => {
  it.each(["pro", "business", "max", "enterprise"] as const)(
    "active %s is untouched (state active, same entitled tier)",
    (tier) => {
      const r = resolveAccountState({ ...base, subscriptionTier: tier });
      expect(r.state).toBe("active");
      expect(r.entitledTier).toBe(tier);
    },
  );
});
