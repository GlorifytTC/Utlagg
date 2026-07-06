import { describe, it, expect } from "vitest";
import {
  buildSie,
  SieBalanceError,
  VAT_INPUT_ACCOUNT,
  type SieReceiptInput,
} from "@/lib/sie-export";
import { encodeCp437 } from "@/lib/cp437";

const receipt = (over: Partial<SieReceiptInput> = {}): SieReceiptInput => ({
  id: "r1",
  vendorName: "ICA",
  date: new Date("2026-03-10T12:00:00Z"),
  totalAmount: "125.00",
  vatAmount: "25.00",
  vatRate: 25,
  basCode: "5611",
  ...over,
});

const baseOpts = {
  company: { name: "Testbolaget AB", orgNumber: "5566778899" },
  from: new Date("2026-01-01T00:00:00Z"),
  to: new Date("2026-12-31T00:00:00Z"),
  generatedAt: new Date("2026-07-06T00:00:00Z"),
};

/** Pull the numeric #TRANS amounts out of the generated text. */
function transAmounts(text: string): number[] {
  return [...text.matchAll(/#TRANS \S+ \{\} (-?\d+\.\d{2})/g)].map((m) => Number(m[1]));
}

/** Group #TRANS amounts per #VER block and return each block's sum. */
function verSums(text: string): number[] {
  return text
    .split("#VER")
    .slice(1)
    .map((block) => transAmounts("#VER" + block).reduce((a, b) => a + b, 0));
}

describe("SIE 4 header", () => {
  const { text } = buildSie({ ...baseOpts, receipts: [receipt()] });

  it("emits mandatory header items in spec order", () => {
    const idx = (tag: string) => text.indexOf(tag);
    expect(idx("#FLAGGA 0")).toBe(0);
    expect(idx("#PROGRAM")).toBeGreaterThan(idx("#FLAGGA 0"));
    expect(idx("#FORMAT PC8")).toBeGreaterThan(idx("#PROGRAM"));
    expect(idx("#GEN 20260706")).toBeGreaterThan(idx("#FORMAT PC8"));
    expect(idx("#SIETYP 4")).toBeGreaterThan(idx("#GEN"));
    // #ORGNR must come before #FNAMN.
    expect(idx("#ORGNR 5566778899")).toBeGreaterThan(idx("#SIETYP 4"));
    expect(idx("#FNAMN")).toBeGreaterThan(idx("#ORGNR"));
    expect(idx("#RAR 0 20260101 20261231")).toBeGreaterThan(idx("#FNAMN"));
  });

  it("quotes the program name and version", () => {
    expect(text).toContain('#PROGRAM "Kvittino" "1.0"');
  });

  it("quotes the company name", () => {
    expect(text).toContain('#FNAMN "Testbolaget AB"');
  });

  it("throws when organisationsnummer is missing", () => {
    expect(() =>
      buildSie({ ...baseOpts, company: { name: "X", orgNumber: "" }, receipts: [receipt()] }),
    ).toThrow(/rganisationsnummer/);
  });
});

describe("SIE 4 verifications", () => {
  const { text } = buildSie({ ...baseOpts, receipts: [receipt()] });

  it("expands a receipt into cost + VAT (2640) + credit (1930) rows", () => {
    expect(text).toContain("#TRANS 5611 {} 100.00"); // net = 125 - 25
    expect(text).toContain(`#TRANS ${VAT_INPUT_ACCOUNT} {} 25.00`);
    expect(text).toContain("#TRANS 1930 {} -125.00");
  });

  it("uses series F with sequential unique verification numbers", () => {
    const { text: multi } = buildSie({
      ...baseOpts,
      receipts: [receipt({ id: "a" }), receipt({ id: "b" }), receipt({ id: "c" })],
    });
    expect(multi).toContain('#VER "F" "1"');
    expect(multi).toContain('#VER "F" "2"');
    expect(multi).toContain('#VER "F" "3"');
  });

  it("every verification balances to 0.00", () => {
    const { text: multi } = buildSie({
      ...baseOpts,
      receipts: [
        receipt({ id: "a" }),
        receipt({ id: "b", totalAmount: "99.99", vatAmount: "20.00", basCode: "6110" }),
        receipt({ id: "c", totalAmount: "1000.00", vatAmount: "0", vatRate: 0 }),
      ],
    });
    for (const sum of verSums(multi)) expect(Math.abs(sum)).toBeLessThan(0.005);
  });

  it("stays balanced (and does not throw) on awkward öre / sub-öre inputs", () => {
    const nasty = [
      receipt({ id: "a", totalAmount: "100.01", vatAmount: "20.00", basCode: "6110" }),
      receipt({ id: "b", totalAmount: "0.05", vatAmount: "0.01", basCode: "6110" }),
      receipt({ id: "c", totalAmount: "33.34", vatAmount: "6.67", basCode: "6110" }),
    ];
    const { text } = buildSie({ ...baseOpts, receipts: nasty });
    for (const sum of verSums(text)) expect(Math.abs(sum)).toBeLessThan(0.005);
  });

  it("SieBalanceError names the offending receipt id (route surfaces this as 422)", () => {
    const err = new SieBalanceError("broken-42", 0.03);
    expect(err).toBeInstanceOf(SieBalanceError);
    expect(err.receiptId).toBe("broken-42");
    expect(err.message).toContain("broken-42");
  });

  it("honours a credit-account override (e.g. 2440 supplier invoice)", () => {
    const { text: t } = buildSie({ ...baseOpts, receipts: [receipt()], creditAccount: "2440" });
    expect(t).toContain("#TRANS 2440 {} -125.00");
    expect(t).toContain('#KONTO 2440 "Leverantörsskulder"');
    expect(t).not.toContain("#TRANS 1930");
  });
});

describe("SIE 4 #KONTO coverage", () => {
  it("declares exactly the distinct accounts used, in ascending order", () => {
    const { text } = buildSie({
      ...baseOpts,
      receipts: [
        receipt({ id: "a", basCode: "5611" }),
        receipt({ id: "b", basCode: "6110" }),
      ],
    });
    const declared = [...text.matchAll(/#KONTO (\d+)/g)].map((m) => m[1]);
    const used = new Set([...text.matchAll(/#TRANS (\d+)/g)].map((m) => m[1]));
    // Every used account is declared…
    for (const acc of used) expect(declared).toContain(acc);
    // …and there are no stray declarations.
    expect(new Set(declared)).toEqual(used);
    // Ascending numeric order.
    const nums = declared.map(Number);
    expect([...nums].sort((a, b) => a - b)).toEqual(nums);
  });
});

describe("zero-VAT receipt", () => {
  it("skips the 2640 row entirely", () => {
    const { text } = buildSie({
      ...baseOpts,
      receipts: [receipt({ totalAmount: "500.00", vatAmount: "0", vatRate: 0, basCode: "5810" })],
    });
    expect(text).not.toContain("#TRANS 2640");
    expect(text).not.toContain("#KONTO 2640");
    expect(text).toContain("#TRANS 5810 {} 500.00");
    expect(text).toContain("#TRANS 1930 {} -500.00");
    for (const sum of verSums(text)) expect(Math.abs(sum)).toBeLessThan(0.005);
  });
});

describe("empty result set", () => {
  it("produces a valid header-only file with no #VER blocks", () => {
    const { text, bytes } = buildSie({ ...baseOpts, receipts: [] });
    expect(text).toContain("#SIETYP 4");
    expect(text).not.toContain("#VER");
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe("CP437 encoding", () => {
  it("round-trips Swedish characters å ä ö Å Ä Ö without loss", () => {
    const vendor = "Smörgås Ähär Öl å ä ö Å Ä Ö";
    const { bytes, warnings } = buildSie({
      ...baseOpts,
      receipts: [receipt({ vendorName: vendor })],
    });
    expect(warnings).toHaveLength(0);
    // Decode the emitted bytes back through the same CP437 table.
    const decoded = decodeCp437(bytes);
    expect(decoded).toContain(vendor); // vendor preserved verbatim
    // The bytes are single-byte CP437, not multi-byte UTF-8.
    expect(bytes.includes(0x86)).toBe(true); // å
    expect(bytes.includes(0x84)).toBe(true); // ä
    expect(bytes.includes(0x94)).toBe(true); // ö
    expect(bytes.includes(0x8f)).toBe(true); // Å
    expect(bytes.includes(0x8e)).toBe(true); // Ä
    expect(bytes.includes(0x99)).toBe(true); // Ö
  });

  it("transliterates unmappable characters instead of crashing", () => {
    const { text, warnings } = buildSie({
      ...baseOpts,
      receipts: [receipt({ vendorName: "Café “Smör” €5 – naïve 😀" })],
    });
    // Curly quotes/dash/euro become ASCII; the emoji falls back to '?'.
    expect(warnings.length).toBeGreaterThan(0);
    expect(text).toContain("Café"); // é is valid CP437
  });
});

describe("golden file", () => {
  it("produces an exact expected SIE byte output", () => {
    const { bytes } = buildSie({
      ...baseOpts,
      receipts: [
        receipt({
          id: "g1",
          vendorName: "Espresso House",
          date: new Date("2026-06-15T09:00:00Z"),
          totalAmount: "250.00",
          vatAmount: "50.00",
          vatRate: 25,
          basCode: "5810",
        }),
      ],
    });

    const expected =
      "#FLAGGA 0\r\n" +
      '#PROGRAM "Kvittino" "1.0"\r\n' +
      "#FORMAT PC8\r\n" +
      "#GEN 20260706\r\n" +
      "#SIETYP 4\r\n" +
      "#ORGNR 5566778899\r\n" +
      '#FNAMN "Testbolaget AB"\r\n' +
      "#RAR 0 20260101 20261231\r\n" +
      '#KONTO 1930 "Företagskonto"\r\n' +
      '#KONTO 2640 "Ingående moms"\r\n' +
      '#KONTO 5810 "Biljetter (tåg/buss/flyg)"\r\n' +
      '#VER "F" "1" 20260615 "Espresso House"\r\n' +
      "{\r\n" +
      "   #TRANS 5810 {} 200.00\r\n" +
      "   #TRANS 2640 {} 50.00\r\n" +
      "   #TRANS 1930 {} -250.00\r\n" +
      "}\r\n";

    expect(bytes.equals(encodeCp437(expected).bytes)).toBe(true);
  });
});

/** Inverse of encodeCp437 for test assertions only. */
function decodeCp437(bytes: Buffer): string {
  // Rebuild the high table used by the encoder.
  const high = [
    0x00c7, 0x00fc, 0x00e9, 0x00e2, 0x00e4, 0x00e0, 0x00e5, 0x00e7, 0x00ea, 0x00eb, 0x00e8, 0x00ef,
    0x00ee, 0x00ec, 0x00c4, 0x00c5, 0x00c9, 0x00e6, 0x00c6, 0x00f4, 0x00f6, 0x00f2, 0x00fb, 0x00f9,
    0x00ff, 0x00d6, 0x00dc, 0x00a2, 0x00a3, 0x00a5, 0x20a7, 0x0192,
  ];
  let out = "";
  for (const b of bytes) {
    if (b <= 0x7f) out += String.fromCharCode(b);
    else if (b - 0x80 < high.length) out += String.fromCodePoint(high[b - 0x80]);
    else out += "?";
  }
  return out;
}
