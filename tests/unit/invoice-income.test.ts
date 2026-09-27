import { describe, it, expect } from "vitest";
import {
  summarizeInvoiceIncome,
  isRecognisedAsIncome,
  type InvoiceLike,
} from "@/lib/invoice-income";

// The invoice from the screenshot: 2000 net + 500 VAT (25%) = 2500 gross.
const inv = (over: Partial<InvoiceLike>): InvoiceLike => ({
  subtotal: 2000,
  vatTotal: 500,
  total: 2500,
  status: "sent",
  reverseCharge: false,
  ...over,
});

describe("invoice income recognition (Sweden, cash method)", () => {
  it("an unpaid invoice is NOT income - it is an outstanding receivable", () => {
    const s = summarizeInvoiceIncome([inv({ status: "sent" })]);
    expect(s.incomeNet).toBe(0);
    expect(s.vatToRemit).toBe(0);
    expect(s.outstandingGross).toBe(2500);
    expect(s.outstandingCount).toBe(1);
    expect(s.paidCount).toBe(0);
  });

  it("a draft invoice is not income either", () => {
    const s = summarizeInvoiceIncome([inv({ status: "draft" })]);
    expect(s.incomeNet).toBe(0);
    expect(s.outstandingGross).toBe(2500);
  });

  it("when paid, income is the NET only (excl. VAT) - VAT is never income", () => {
    const s = summarizeInvoiceIncome([inv({ status: "paid" })]);
    expect(s.incomeNet).toBe(2000); // the money the company actually earns
    expect(s.vatToRemit).toBe(500); // owed to Skatteverket, not income
    expect(s.paidGross).toBe(2500);
    expect(s.outstandingGross).toBe(0);
    expect(s.paidCount).toBe(1);
  });

  it("reverse-charge paid invoice recognises net income but no output VAT", () => {
    const s = summarizeInvoiceIncome([
      inv({ status: "paid", reverseCharge: true, vatTotal: 0, total: 2000 }),
    ]);
    expect(s.incomeNet).toBe(2000);
    expect(s.vatToRemit).toBe(0);
  });

  it("mixes paid and unpaid correctly and does not leak VAT into income", () => {
    const s = summarizeInvoiceIncome([
      inv({ status: "paid" }), // +2000 net, +500 VAT
      inv({ status: "paid", subtotal: 1000, vatTotal: 250, total: 1250 }),
      inv({ status: "sent", subtotal: 800, vatTotal: 200, total: 1000 }),
    ]);
    expect(s.incomeNet).toBe(3000);
    expect(s.vatToRemit).toBe(750);
    expect(s.paidGross).toBe(3750);
    expect(s.outstandingGross).toBe(1000);
    expect(s.paidCount).toBe(2);
    expect(s.outstandingCount).toBe(1);
  });

  it("handles numeric strings from the DB (numeric columns) without drift", () => {
    const s = summarizeInvoiceIncome([
      { subtotal: "2000.00", vatTotal: "500.00", total: "2500.00", status: "paid", reverseCharge: false },
    ]);
    expect(s.incomeNet).toBe(2000);
    expect(s.vatToRemit).toBe(500);
  });

  it("isRecognisedAsIncome is true only for paid", () => {
    expect(isRecognisedAsIncome({ status: "paid" })).toBe(true);
    expect(isRecognisedAsIncome({ status: "sent" })).toBe(false);
    expect(isRecognisedAsIncome({ status: "draft" })).toBe(false);
  });
});
