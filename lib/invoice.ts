/**
 * Customer-invoice (kundfaktura) totals. The app only stores and renders what
 * the company enters — the company is responsible for the invoice's correctness.
 */

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number; // per unit, excl. VAT
  vatRate: number; // 0 | 6 | 12 | 25
}

/** Required wording for construction-sector reverse charge (Skatteverket). */
export const REVERSE_CHARGE_TEXT = "Omvänd skattskyldighet för byggtjänster gäller";

export function computeInvoiceTotals(lines: InvoiceLine[], reverseCharge: boolean) {
  let subtotal = 0;
  let vatTotal = 0;
  for (const l of lines) {
    const net = (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);
    subtotal += net;
    // Reverse charge: seller adds NO VAT — the buyer accounts for it.
    if (!reverseCharge) vatTotal += net * ((Number(l.vatRate) || 0) / 100);
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    subtotal: round(subtotal),
    vatTotal: round(vatTotal),
    total: round(subtotal + vatTotal),
  };
}
