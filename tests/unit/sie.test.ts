import { describe, it, expect } from "vitest";
import { buildSie } from "@/lib/sie-export";

const receipt = (over: Record<string, unknown> = {}) =>
  ({
    id: "r1",
    vendorName: "ICA",
    date: new Date("2026-03-10"),
    totalAmount: "125.00",
    vatAmount: "25.00",
    vatRate: 25,
    basCode: "5611",
    category: "fuel",
    ...over,
  }) as never;

describe("SIE 4 export", () => {
  const sie = buildSie({
    companyName: "Testbolaget AB",
    orgNumber: "5566778899",
    fromYear: 2026,
    receipts: [receipt()],
  });

  it("includes the SIE type and company header", () => {
    expect(sie).toContain("#SIETYP 4");
    expect(sie).toContain('#FNAMN "Testbolaget AB"');
    expect(sie).toContain("#ORGNR 5566778899");
  });

  it("creates a verification with balanced transactions", () => {
    expect(sie).toContain("#VER");
    // net (100) on cost account, vat (25) on 2641, gross (-125) on outlay
    expect(sie).toContain("#TRANS 5611 {} 100.00");
    expect(sie).toContain("#TRANS 2641 {} 25.00");
    expect(sie).toContain("#TRANS 2890 {} -125.00");
  });

  it("each voucher's transactions sum to zero (balanced)", () => {
    const transAmounts = [...sie.matchAll(/#TRANS \S+ \{\} (-?\d+\.\d{2})/g)].map((m) =>
      Number(m[1]),
    );
    const sum = transAmounts.reduce((a, b) => a + b, 0);
    expect(Math.abs(sum)).toBeLessThan(0.001);
  });
});
