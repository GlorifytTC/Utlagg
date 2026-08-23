import { describe, it, expect } from "vitest";
import {
  TIERS,
  TIER_ORDER,
  SELECTABLE_TIERS,
  TRIAL_DAYS,
  TRIAL_SCANS,
  POST_TRIAL_DEFAULT_PLAN,
  TRIAL_GUARD_RETENTION_MONTHS,
} from "@/lib/billing/config";

describe("Starter tier (spec §B)", () => {
  it("is 50 kr / 100 scans, single seat, 0.50 kr overage", () => {
    expect(TIERS.starter.priceOre).toBe(5_000);
    expect(TIERS.starter.monthlyScans).toBe(100);
    expect(TIERS.starter.seats).toBe(1);
    expect(TIERS.starter.overageOrePerScan).toBe(50);
    expect(TIERS.starter.stripeLookupKey).toBe("kvittino_starter_monthly");
  });

  it("sits between free and pro in the order", () => {
    expect(TIER_ORDER).toEqual(["free", "starter", "pro", "business", "max", "enterprise"]);
  });
});

describe("Free tombstone (spec §7)", () => {
  it("is retained in the enum/table but not selectable", () => {
    expect(TIERS.free.selectable).toBe(false);
    expect(SELECTABLE_TIERS).not.toContain("free");
    expect(TIER_ORDER).toContain("free"); // still present for existing rows
  });

  it("offers Starter…Enterprise, in order", () => {
    expect(SELECTABLE_TIERS).toEqual(["starter", "pro", "business", "max", "enterprise"]);
  });
});

describe("overage taper stays strictly decreasing incl. Starter (spec §2)", () => {
  it("Starter > Pro > Business > Max", () => {
    const s = TIERS.starter.overageOrePerScan!;
    const p = TIERS.pro.overageOrePerScan!;
    const b = TIERS.business.overageOrePerScan!;
    const m = TIERS.max.overageOrePerScan!;
    expect([s, p, b, m]).toEqual([50, 39, 29, 19]);
    expect(s).toBeGreaterThan(p);
    expect(p).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(m);
  });
});

describe("regression — existing paid tiers unchanged from V2", () => {
  it("Pro/Business/Max prices, quotas and lookup keys are untouched", () => {
    expect(TIERS.pro.priceOre).toBe(14_900);
    expect(TIERS.pro.monthlyScans).toBe(500);
    expect(TIERS.business.priceOre).toBe(29_900);
    expect(TIERS.business.monthlyScans).toBe(1_500);
    expect(TIERS.max.priceOre).toBe(69_900);
    expect(TIERS.max.monthlyScans).toBe(5_000);
  });
});

describe("trial constants + ToS coupling", () => {
  it("30-day / 500-scan trial, default post-trial plan Pro", () => {
    expect(TRIAL_DAYS).toBe(30);
    expect(TRIAL_SCANS).toBe(500);
    expect(POST_TRIAL_DEFAULT_PLAN).toBe("pro");
  });

  it("token retention is 24 months (must match Privacy clause F.5)", () => {
    expect(TRIAL_GUARD_RETENTION_MONTHS).toBe(24);
  });
});
