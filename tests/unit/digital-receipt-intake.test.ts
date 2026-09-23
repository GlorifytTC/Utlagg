import { describe, it, expect } from "vitest";
import { parseReceiptText } from "@/lib/ocr";
import { recipientToken, htmlToText } from "@/lib/inbound/parse";

// The whole point of the digital channel: text that is ALREADY text (email
// body / PDF text layer) goes straight through the existing free parser — no
// OCR, no image tokens. These assert that path yields real fields.
describe("digital receipt text → parseReceiptText (no OCR)", () => {
  it("parses a plaintext emailed receipt", () => {
    const email = [
      "Tack för ditt köp hos Willys!",
      "Datum: 2026-03-14",
      "Kvittonummer: 88213",
      "Moms 12%: 24.00 kr",
      "Att betala: 224.00 kr",
    ].join("\n");
    const r = parseReceiptText(email);
    expect(r.date).toBe("2026-03-14");
    expect(r.receiptNumber).toBe("88213");
    expect(r.totalAmount).toBe(224);
    expect(r.vatRate).toBe(12);
  });

  it("parses text pulled from a Kivra-style PDF layer", () => {
    const pdfText = "BAUHAUS\nOrg.nr 556197-2337\n2026-01-09\nTotalt 1499.00\nMoms 25% 299.80";
    const r = parseReceiptText(pdfText);
    expect(r.totalAmount).toBe(1499);
    expect(r.vatRate).toBe(25);
  });
});

describe("recipientToken — routes mail to the right user", () => {
  it("extracts the plus-tag token", () => {
    expect(recipientToken(["kvitto+abc123@inbound.utlagg.se"])).toBe("abc123");
  });
  it("scans multiple recipients (To + Cc)", () => {
    expect(recipientToken(["someone@else.com", "kvitto+deadbeef@inbound.utlagg.se"])).toBe(
      "deadbeef",
    );
  });
  it("returns null for a plain address with no token", () => {
    expect(recipientToken(["hello@utlagg.se"])).toBeNull();
  });
  it("ignores undefined entries", () => {
    expect(recipientToken([undefined, "kvitto+z9@inbound.utlagg.se"])).toBe("z9");
  });
});

describe("htmlToText — fallback when no plaintext part", () => {
  it("strips tags and decodes basic entities", () => {
    const out = htmlToText("<p>Total: 99&nbsp;kr &amp; moms</p><script>x()</script>");
    expect(out).toContain("Total: 99 kr & moms");
    expect(out).not.toContain("x()");
  });
});
