import { describe, it, expect } from "vitest";
import { decideScan } from "@/lib/billing/quota";
import { TIERS } from "@/lib/billing/config";

const base = {
  unlimited: false,
  planScansUsed: 0,
  planLimit: 500,
  creditsRemaining: 0,
  overageRateOre: 39,
  overageOreSoFar: 0,
  spendCapOre: 20_000,
};

describe("decideScan — quota / credit / overage ordering", () => {
  it("draws from the included plan quota first", () => {
    const d = decideScan({ ...base, planScansUsed: 10 });
    expect(d.allowed).toBe(true);
    expect(d.consume).toBe("plan");
    expect(d.overageChargeOre).toBe(0);
  });

  it("consumes credits BEFORE overage once the plan quota is exhausted", () => {
    const d = decideScan({
      ...base,
      planScansUsed: 500, // quota gone
      creditsRemaining: 3,
    });
    expect(d.consume).toBe("credit");
    expect(d.overageChargeOre).toBe(0);
  });

  it("bills overage only after quota AND credits are exhausted", () => {
    const d = decideScan({
      ...base,
      planScansUsed: 500,
      creditsRemaining: 0,
    });
    expect(d.allowed).toBe(true);
    expect(d.consume).toBe("overage");
    expect(d.overageChargeOre).toBe(39);
  });

  it("free tier hard-stops at its quota (no overage, no auto-charge)", () => {
    const d = decideScan({
      ...base,
      planLimit: 15,
      planScansUsed: 15,
      overageRateOre: null, // free = no overage
    });
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("free_hard_stop");
    expect(d.consume).toBeNull();
  });

  it("stops auto-overage once the spend cap would be exceeded", () => {
    const overCap = decideScan({
      ...base,
      planScansUsed: 500,
      overageOreSoFar: 19_962, // + 39 = 20_001 > 20_000
      spendCapOre: 20_000,
    });
    expect(overCap.allowed).toBe(false);
    expect(overCap.reason).toBe("spend_cap_reached");
  });

  it("allows the overage scan that lands exactly on the cap", () => {
    const atCap = decideScan({
      ...base,
      planScansUsed: 500,
      overageOreSoFar: 19_961, // + 39 = 20_000 === cap
      spendCapOre: 20_000,
    });
    expect(atCap.allowed).toBe(true);
    expect(atCap.consume).toBe("overage");
  });

  it("never caps legacy-unlimited / enterprise scans", () => {
    const d = decideScan({ ...base, unlimited: true, planScansUsed: 9_999_999 });
    expect(d.allowed).toBe(true);
    expect(d.reason).toBe("unlimited");
  });
});

describe("overage taper — higher tiers get a cheaper per-scan rate", () => {
  it("Pro > Business > Max (öre per scan, strictly decreasing)", () => {
    const pro = TIERS.pro.overageOrePerScan!;
    const business = TIERS.business.overageOrePerScan!;
    const max = TIERS.max.overageOrePerScan!;
    expect(pro).toBeGreaterThan(business);
    expect(business).toBeGreaterThan(max);
    expect([pro, business, max]).toEqual([39, 29, 19]);
  });

  it("free tier has no overage rate", () => {
    expect(TIERS.free.overageOrePerScan).toBeNull();
  });
});
