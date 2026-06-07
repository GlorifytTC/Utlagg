import { describe, it, expect } from "vitest";
import { resolveVatRate, vatFromGross } from "@/lib/vat";

describe("VAT engine (date-aware, Sweden)", () => {
  const inWindow = new Date("2026-06-01"); // food cut 6% window (2026-2027)
  const afterWindow = new Date("2028-01-01"); // reverts to 12%

  it("groceries are 6% during the 2026-2027 reduction", () => {
    expect(resolveVatRate("groceries", inWindow)).toBe(6);
  });

  it("groceries revert to 12% in 2028", () => {
    expect(resolveVatRate("groceries", afterWindow)).toBe(12);
  });

  it("restaurant dine-in is 12%", () => {
    expect(resolveVatRate("restaurant_dinein", inWindow)).toBe(12);
  });

  it("takeaway is 6% during the window", () => {
    expect(resolveVatRate("takeaway", inWindow)).toBe(6);
  });

  it("alcohol is always standard 25%", () => {
    expect(resolveVatRate("alcohol", inWindow)).toBe(25);
  });

  it("splits a gross amount into net + vat at 25%", () => {
    const r = vatFromGross(1250, 25);
    expect(r.vat).toBeCloseTo(250, 2);
    expect(r.net).toBeCloseTo(1000, 2);
  });

  it("splits a gross amount at 12%", () => {
    const r = vatFromGross(112, 12);
    expect(r.vat).toBeCloseTo(12, 2);
    expect(r.net).toBeCloseTo(100, 2);
  });
});
