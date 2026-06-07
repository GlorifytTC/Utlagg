import { describe, it, expect } from "vitest";
import { hasFeature, entitlementsFor, FEATURE_MIN_TIER } from "@/lib/features";

describe("feature entitlements", () => {
  it("free tier has none of the premium features", () => {
    const e = entitlementsFor("free");
    expect(e.fortnox).toBe(false);
    expect(e.mileage).toBe(false);
    expect(e.approvals).toBe(false);
  });

  it("pro unlocks fortnox but not company features", () => {
    expect(hasFeature("pro", "fortnox")).toBe(true);
    expect(hasFeature("pro", "mileage")).toBe(false);
    expect(hasFeature("pro", "approvals")).toBe(false);
  });

  it("business unlocks everything gated", () => {
    const e = entitlementsFor("business");
    expect(e.fortnox && e.mileage && e.approvals).toBe(true);
  });

  it("enterprise inherits all features", () => {
    expect(hasFeature("enterprise", "mileage")).toBe(true);
  });

  it("mileage and approvals require Företag (business)", () => {
    expect(FEATURE_MIN_TIER.mileage).toBe("business");
    expect(FEATURE_MIN_TIER.approvals).toBe("business");
  });
});
