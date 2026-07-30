import { describe, it, expect } from "vitest";
import { hasFeature, entitlementsFor, FEATURE_MIN_TIER } from "@/lib/features";

describe("feature entitlements", () => {
  it("free tier has none of the premium features", () => {
    const e = entitlementsFor("free");
    expect(e.fortnox).toBe(false);
    expect(e.mileage).toBe(false);
    expect(e.approvals).toBe(false);
  });

  it("pro unlocks fortnox + mileage but not company approval flows", () => {
    // Pricing V2 tier table: Pro is "full features" incl. mileage; approvals
    // (attestflöden) remain a Företag/Business team feature.
    expect(hasFeature("pro", "fortnox")).toBe(true);
    expect(hasFeature("pro", "mileage")).toBe(true);
    expect(hasFeature("pro", "approvals")).toBe(false);
  });

  it("business unlocks everything gated", () => {
    const e = entitlementsFor("business");
    expect(e.fortnox && e.mileage && e.approvals).toBe(true);
  });

  it("enterprise inherits all features", () => {
    expect(hasFeature("enterprise", "mileage")).toBe(true);
  });

  it("approvals require Företag (business); mileage now unlocks at Pro", () => {
    expect(FEATURE_MIN_TIER.mileage).toBe("pro");
    expect(FEATURE_MIN_TIER.approvals).toBe("business");
  });
});
