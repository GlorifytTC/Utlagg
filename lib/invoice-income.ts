/**
 * Income recognition for customer invoices (kundfakturor), Swedish rules.
 *
 * Two principles drive this, and both are non-negotiable for correct books:
 *
 *  1. VAT is never income. The moms a company adds to an invoice (6/12/25 %)
 *     is output VAT (utgående moms) collected on Skatteverket's behalf and
 *     paid on to them. Only the amount EXCLUDING VAT (the net / subtotal) is
 *     the company's revenue (intäkt).
 *
 *  2. Under the cash method (kontantmetoden) — permitted for businesses with a
 *     turnover under ~3 MSEK and the simplest model for a small company —
 *     revenue and output VAT are recognised when the invoice is PAID, not when
 *     it is issued. An unpaid invoice is an accounts-receivable (kundfordran),
 *     not yet income.
 *
 * This helper is pure so it can be unit-tested and reused by any view.
 */

export interface InvoiceLike {
  subtotal: number | string; // net, excl. VAT
  vatTotal: number | string; // output VAT
  total: number | string; // gross (subtotal + vatTotal)
  status: string; // "draft" | "sent" | "paid"
  reverseCharge?: boolean | null;
}

export interface InvoiceIncomeSummary {
  /** Recognised revenue: net (excl. VAT) of PAID invoices. This is "the money we get". */
  incomeNet: number;
  /** Output VAT on PAID invoices — owed to Skatteverket, not income. */
  vatToRemit: number;
  /** Gross of PAID invoices (incomeNet + vatToRemit), for reconciliation. */
  paidGross: number;
  /** Gross still owed to the company: unpaid invoices (kundfordringar). Not income yet. */
  outstandingGross: number;
  paidCount: number;
  outstandingCount: number;
}

const num = (v: number | string): number => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const round = (n: number): number => Math.round(n * 100) / 100;

/** Is this invoice recognised as income? Only when it has actually been paid. */
export function isRecognisedAsIncome(inv: Pick<InvoiceLike, "status">): boolean {
  return inv.status === "paid";
}

export function summarizeInvoiceIncome(invoices: InvoiceLike[]): InvoiceIncomeSummary {
  let incomeNet = 0;
  let vatToRemit = 0;
  let paidGross = 0;
  let outstandingGross = 0;
  let paidCount = 0;
  let outstandingCount = 0;

  for (const inv of invoices) {
    if (isRecognisedAsIncome(inv)) {
      incomeNet += num(inv.subtotal);
      // Reverse-charge invoices carry no output VAT (buyer accounts for it).
      vatToRemit += inv.reverseCharge ? 0 : num(inv.vatTotal);
      paidGross += num(inv.total);
      paidCount += 1;
    } else {
      outstandingGross += num(inv.total);
      outstandingCount += 1;
    }
  }

  return {
    incomeNet: round(incomeNet),
    vatToRemit: round(vatToRemit),
    paidGross: round(paidGross),
    outstandingGross: round(outstandingGross),
    paidCount,
    outstandingCount,
  };
}
