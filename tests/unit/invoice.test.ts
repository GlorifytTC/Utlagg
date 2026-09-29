import { describe, it, expect } from "vitest";
import { computeInvoiceTotals, formatSellerAddress, vatBreakdown, type InvoiceLine } from "@/lib/invoice";

const line = (unitPrice: number, vatRate: number, quantity = 1): InvoiceLine => ({
  description: "x",
  quantity,
  unitPrice,
  vatRate,
});

describe("vatBreakdown", () => {
  const lines = [line(1000, 25), line(200, 12, 2), line(99.99, 6), line(50, 0), line(333.33, 25, 3)];

  it("groups net and VAT per rate, highest rate first", () => {
    expect(vatBreakdown(lines, false)).toEqual([
      { rate: 25, net: 1999.99, vat: 500 },
      { rate: 12, net: 400, vat: 48 },
      { rate: 6, net: 99.99, vat: 6 },
      { rate: 0, net: 50, vat: 0 },
    ]);
  });

  it("puts everything at 0% under reverse charge", () => {
    expect(vatBreakdown(lines, true)).toEqual([{ rate: 0, net: 2549.98, vat: 0 }]);
  });

  it("VAT rows always add up to the invoice vatTotal", () => {
    for (const rc of [false, true]) {
      const rows = vatBreakdown(lines, rc);
      const totals = computeInvoiceTotals(lines, rc);
      const sum = Math.round(rows.reduce((s, r) => s + r.vat, 0) * 100) / 100;
      expect(sum).toBe(totals.vatTotal);
      expect(totals.total).toBe(Math.round((totals.subtotal + totals.vatTotal) * 100) / 100);
    }
  });
});

describe("formatSellerAddress", () => {
  it("puts street and postal line on separate lines", () => {
    expect(formatSellerAddress({ address: "Storgatan 1", postalCode: "123 45", city: "Stockholm" })).toBe(
      "Storgatan 1\n123 45 Stockholm",
    );
    expect(formatSellerAddress({ city: "Malmö" })).toBe("Malmö");
    expect(formatSellerAddress({})).toBeNull();
  });
});
