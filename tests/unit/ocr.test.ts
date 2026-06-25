import { describe, it, expect } from "vitest";
import { parseReceiptText } from "@/lib/ocr";

describe("parseReceiptText — receipt/bong number extraction", () => {
  it("matches 'Bongnr' with no space before the number", () => {
    expect(parseReceiptText("Bongnr 19283").receiptNumber).toBe("19283");
  });

  it("matches 'Bong nr:' with a colon and space", () => {
    expect(parseReceiptText("Bong nr: 19283").receiptNumber).toBe("19283");
  });

  it("matches 'Transaktion' as a label", () => {
    expect(parseReceiptText("Transaktion 0042").receiptNumber).toBe("0042");
  });

  it("matches 'Ordernr:'", () => {
    expect(parseReceiptText("Ordernr: 778899").receiptNumber).toBe("778899");
  });

  it("matches 'Receipt No.' (English)", () => {
    expect(parseReceiptText("Receipt No. 482917").receiptNumber).toBe("482917");
  });

  it("matches 'Kvittonummer:'", () => {
    expect(parseReceiptText("Kvittonummer: 482917").receiptNumber).toBe("482917");
  });

  it("matches when the label and number are on separate lines", () => {
    expect(parseReceiptText("Kvitto nr:\n00482917").receiptNumber).toBe("00482917");
  });

  it("does not mistake an org number for a receipt number", () => {
    expect(parseReceiptText("Org.nr 556677-8899").receiptNumber).toBeNull();
  });

  it("does not mistake a phone number for a receipt number", () => {
    expect(parseReceiptText("Telefon 08-1234567").receiptNumber).toBeNull();
  });

  it("extracts vendor, number, date and total together from a full receipt", () => {
    const receipt = parseReceiptText(
      `ICA SUPERMARKET\nOrg.nr 556677-8899\n2026-03-12 14:32\n\nBongnr 19283\n\nVaror          245,00\nMoms 12%        26,25\n-------------------\nTotalt         245,00`,
    );
    expect(receipt.receiptNumber).toBe("19283");
    expect(receipt.date).toBe("2026-03-12");
    expect(receipt.totalAmount).toBe(245);
  });
});
