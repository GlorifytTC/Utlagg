import { describe, it, expect } from "vitest";
import { seatLimit, UNLIMITED } from "@/lib/billing/config";

describe("seatLimit - seats come from the owner's tier", () => {
  it("solo tiers hold one seat", () => {
    expect(seatLimit("starter", null)).toBe(1);
    expect(seatLimit("pro", null)).toBe(1);
  });

  it("business is capped at 10, max is unlimited", () => {
    expect(seatLimit("business", null)).toBe(10);
    expect(seatLimit("max", null)).toBe(UNLIMITED);
  });

  it("enterprise uses the negotiated custom seat count", () => {
    expect(seatLimit("enterprise", 40)).toBe(40);
  });

  it("enterprise with no custom count is unlimited", () => {
    expect(seatLimit("enterprise", null)).toBe(UNLIMITED);
  });

  it("custom seats are ignored on non-enterprise tiers", () => {
    expect(seatLimit("business", 500)).toBe(10);
  });
});
