import type { customerInvoices } from "@/db/schema";
import type { Translations } from "@/lib/translations";
import { REVERSE_CHARGE_TEXT, vatBreakdown, type InvoiceLine, type SellerDetails } from "@/lib/invoice";

type Invoice = typeof customerInvoices.$inferSelect;

const money = new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const kr = (n: unknown) => money.format(Number(n) || 0);
const date = (d: Date | string) => new Date(d).toLocaleDateString("sv-SE");

/**
 * The printable customer invoice (A4). Shared by the company's own view and
 * the accountant's read-only view. Always light: it is a paper document, so no
 * dark: variants inside. Only the seller's own branding appears on it.
 */
export function InvoiceSheet({
  inv,
  t,
  logoUrl,
}: {
  inv: Invoice;
  t: Translations;
  logoUrl?: string | null;
}) {
  const lines = (inv.lineItems as InvoiceLine[]) ?? [];
  const seller = (inv.sellerDetails as SellerDetails | null) ?? {};
  const vatRows = vatBreakdown(lines, inv.reverseCharge);
  const isPaid = inv.status === "paid";
  const termsDays =
    inv.dueDate &&
    Math.round((new Date(inv.dueDate).getTime() - new Date(inv.issueDate).getTime()) / 86_400_000);
  const payTo = [
    seller.bankgiro && [t.invBankgiro, seller.bankgiro],
    seller.plusgiro && [t.invPlusgiro, seller.plusgiro],
    seller.iban && [t.invIban, seller.iban],
    seller.bic && [t.invBic, seller.bic],
  ].filter(Boolean) as [string, string][];
  const footer = [
    inv.sellerAddress?.replace(/\n/g, ", "),
    inv.sellerOrgNumber && `${t.invOrgNr} ${inv.sellerOrgNumber}`,
    inv.sellerVatNumber && `${t.invVatNr} ${inv.sellerVatNumber}`,
    seller.fSkatt && t.invFSkatt,
    seller.email,
    seller.phone,
    seller.website,
  ].filter(Boolean);

  return (
    <div className="invoice-sheet flex flex-col rounded-2xl border border-gray-200 bg-white p-6 text-[13px] sm:p-10 leading-relaxed text-gray-800 print:min-h-[290mm]">
      {/* Header: seller identity left, document title + meta right */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0">
          {logoUrl && (
            <img src={logoUrl} alt="" className="mb-3 max-h-14 max-w-[180px] object-contain" />
          )}
          <p className="text-lg font-semibold text-gray-900">{inv.sellerName}</p>
          {inv.sellerAddress && <p className="whitespace-pre-line text-gray-600">{inv.sellerAddress}</p>}
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="text-2xl font-semibold tracking-[0.2em] text-gray-900">{t.invInvoiceWord}</p>
          <dl className="mt-3 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-left">
            <dt className="text-gray-500">{t.invSheetNumber}</dt>
            <dd className="text-right font-medium text-gray-900">{inv.invoiceNumber}</dd>
            <dt className="text-gray-500">{t.invSheetDate}</dt>
            <dd className="text-right">{date(inv.issueDate)}</dd>
            {inv.dueDate && (
              <>
                <dt className="text-gray-500">{t.invSheetDue}</dt>
                <dd className="text-right font-medium text-gray-900">{date(inv.dueDate)}</dd>
              </>
            )}
            {termsDays ? (
              <>
                <dt className="text-gray-500">{t.invSheetTerms}</dt>
                <dd className="text-right">
                  {termsDays} {t.invTermsDaysNet}
                </dd>
              </>
            ) : null}
          </dl>
        </div>
      </div>

      {/* Buyer */}
      <div className="mt-10 sm:max-w-[60%]">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{t.invBillTo}</p>
        <p className="mt-1 font-semibold text-gray-900">{inv.buyerName}</p>
        {inv.buyerAddress && <p className="whitespace-pre-line">{inv.buyerAddress}</p>}
        {inv.buyerOrgNumber && <p>{t.invOrgNr} {inv.buyerOrgNumber}</p>}
        {inv.buyerVatNumber && <p>{t.invVatNr} {inv.buyerVatNumber}</p>}
      </div>

      {/* Lines */}
      <table className="mt-8 w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-900 text-left text-[11px] uppercase tracking-wider text-gray-500">
            <th className="py-2 font-semibold">{t.phDescription}</th>
            <th className="py-2 text-right font-semibold">{t.phQuantity}</th>
            <th className="py-2 text-right font-semibold">{t.phUnitPrice}</th>
            {!inv.reverseCharge && <th className="py-2 text-right font-semibold">{t.invColVat}</th>}
            <th className="py-2 text-right font-semibold">{t.invColAmount}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="invoice-row border-b border-gray-200 align-top">
              <td className="py-2 pr-4">{l.description}</td>
              <td className="py-2 text-right tabular-nums">{l.quantity}</td>
              <td className="py-2 text-right tabular-nums">{kr(l.unitPrice)}</td>
              {!inv.reverseCharge && <td className="py-2 text-right tabular-nums">{l.vatRate} %</td>}
              <td className="py-2 text-right tabular-nums">{kr(l.quantity * l.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="invoice-row mt-4 ml-auto w-full max-w-72 space-y-1 tabular-nums">
        <div className="flex justify-between">
          <span>{t.invSubtotal}</span>
          <span>{kr(inv.subtotal)}</span>
        </div>
        {inv.reverseCharge ? (
          <div className="flex justify-between">
            <span>{t.invColVat}</span>
            <span>{kr(0)}</span>
          </div>
        ) : (
          vatRows.map((r) => (
            <div key={r.rate} className="flex justify-between">
              <span>
                {t.invColVat} {r.rate} % {t.invVatOn} {kr(r.net)}
              </span>
              <span>{kr(r.vat)}</span>
            </div>
          ))
        )}
        <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-base font-semibold text-gray-900">
          <span>{t.invToPay}</span>
          <span>
            {kr(inv.total)} {inv.currency}
          </span>
        </div>
        {isPaid && <p className="pt-1 text-right font-semibold uppercase tracking-wider text-emerald-700">{t.invPaidStamp}</p>}
      </div>

      {inv.reverseCharge && (
        <p className="invoice-row mt-6 border-l-2 border-gray-900 pl-3 font-medium">{REVERSE_CHARGE_TEXT}</p>
      )}
      {inv.note && <p className="invoice-row mt-6 whitespace-pre-line text-gray-600">{inv.note}</p>}

      {/* Payment box; old invoices without seller details simply omit it */}
      {payTo.length > 0 && !isPaid && (
        <div className="invoice-row mt-8 grid grid-cols-2 gap-x-8 gap-y-1 rounded-lg border border-gray-300 p-4 sm:grid-cols-4">
          <p className="col-span-full mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {t.invPaymentTitle}
          </p>
          {payTo.map(([label, value]) => (
            <div key={label}>
              <p className="text-gray-500">{label}</p>
              <p className="font-medium text-gray-900">{value}</p>
            </div>
          ))}
          <div>
            <p className="text-gray-500">{t.invReference}</p>
            <p className="font-medium text-gray-900">{inv.invoiceNumber}</p>
          </div>
          {inv.dueDate && (
            <div>
              <p className="text-gray-500">{t.invSheetDue}</p>
              <p className="font-medium text-gray-900">{date(inv.dueDate)}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500">{t.invToPay}</p>
            <p className="font-medium text-gray-900">
              {kr(inv.total)} {inv.currency}
            </p>
          </div>
          <p className="col-span-full mt-2 text-gray-500">{t.invReferenceHint}</p>
        </div>
      )}

      {/* Footer: classic Swedish invoice foot with the seller's registration data */}
      <div className="mt-auto pt-10">
        <div className="border-t border-gray-300 pt-3 text-center text-[11px] text-gray-500">
          <p className="font-medium text-gray-700">{inv.sellerName}</p>
          <p>{footer.join("  ·  ")}</p>
        </div>
      </div>
    </div>
  );
}
