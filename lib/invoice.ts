/**
 * Customer-invoice (kundfaktura) totals. The app only stores and renders what
 * the company enters - the company is responsible for the invoice's correctness.
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
  // VAT is rounded per rate (as printed on the invoice) and then summed, so the
  // VAT rows on the sheet always add up to the stored vatTotal.
  // Reverse charge: seller adds NO VAT - the buyer accounts for it.
  const rows = vatBreakdown(lines, reverseCharge);
  const round = (n: number) => Math.round(n * 100) / 100;
  const subtotal = round(rows.reduce((s, r) => s + r.net, 0));
  const vatTotal = round(rows.reduce((s, r) => s + r.vat, 0));
  return { subtotal, vatTotal, total: round(subtotal + vatTotal) };
}

/**
 * Seller payment/contact details shown on the invoice. Stored on the company
 * (companies.invoice_details) and frozen onto each invoice at issue time
 * (customer_invoices.seller_details), same as the other seller fields.
 */
export interface SellerDetails {
  bankgiro?: string;
  plusgiro?: string;
  iban?: string;
  bic?: string;
  fSkatt?: boolean; // "Godkänd för F-skatt"
  email?: string;
  phone?: string;
  website?: string;
}

export function hasPaymentMethod(d: SellerDetails | null | undefined): boolean {
  return Boolean(d?.bankgiro || d?.plusgiro || d?.iban);
}

/** "Storgatan 1\n123 45 Stockholm", or null when nothing is set. */
export function formatSellerAddress(c: {
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
}): string | null {
  const postal = [c.postalCode, c.city].filter(Boolean).join(" ");
  return [c.address, postal].filter(Boolean).join("\n") || null;
}

/**
 * Net and VAT per rate. Mervärdesskattelagen requires the VAT amount per rate
 * on the invoice when lines carry different rates. Sorted by rate, highest first.
 */
export function vatBreakdown(lines: InvoiceLine[], reverseCharge: boolean) {
  const byRate = new Map<number, number>();
  for (const l of lines) {
    const rate = reverseCharge ? 0 : Number(l.vatRate) || 0;
    const net = (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);
    byRate.set(rate, (byRate.get(rate) ?? 0) + net);
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return Array.from(byRate, ([rate, net]) => ({
    rate,
    net: round(net),
    vat: round(net * (rate / 100)),
  })).sort((a, b) => b.rate - a.rate);
}
