import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { customerInvoices } from "@/db/schema";
import { getUserCompany } from "@/lib/company";
import { REVERSE_CHARGE_TEXT, type InvoiceLine } from "@/lib/invoice";
import { PrintButton } from "@/components/PrintButton";
import { getT } from "@/lib/i18n-server";

export const metadata = { title: "Faktura" };
export const dynamic = "force-dynamic";

const kr = (n: unknown) => Number(n).toFixed(2).replace(".", ",");

export default async function InvoiceView({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const membership = await getUserCompany(session.user.id);
  if (!membership) redirect("/dashboard/invoices");

  const [inv] = await db
    .select()
    .from(customerInvoices)
    .where(and(eq(customerInvoices.id, params.id), eq(customerInvoices.companyId, membership.companyId)))
    .limit(1);
  if (!inv) notFound();

  const t = getT();
  const lines = (inv.lineItems as InvoiceLine[]) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/dashboard/invoices" className="text-sm text-nordic-600 underline">← {t.navInvoices}</Link>
        <PrintButton />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-900 dark:border-gray-800 dark:bg-white">
        <div className="flex justify-between">
          <div>
            <p className="text-lg font-bold">{inv.sellerName}</p>
            {inv.sellerOrgNumber && <p>{t.invOrgNr} {inv.sellerOrgNumber}</p>}
            {inv.sellerVatNumber && <p>{t.invVatNr} {inv.sellerVatNumber}</p>}
            {inv.sellerAddress && <p>{inv.sellerAddress}</p>}
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">{t.invInvoiceWord}</p>
            <p>{t.invNrLabel} {inv.invoiceNumber}</p>
            <p>{t.invDateLabel} {new Date(inv.issueDate).toLocaleDateString()}</p>
            {inv.dueDate && <p>{t.invDueLabel} {new Date(inv.dueDate).toLocaleDateString()}</p>}
          </div>
        </div>

        <div className="mt-6">
          <p className="font-semibold">{t.invBillTo}</p>
          <p>{inv.buyerName}</p>
          {inv.buyerOrgNumber && <p>{t.invOrgNr} {inv.buyerOrgNumber}</p>}
          {inv.buyerVatNumber && <p>{t.invVatNr} {inv.buyerVatNumber}</p>}
          {inv.buyerAddress && <p>{inv.buyerAddress}</p>}
        </div>

        <table className="mt-6 w-full text-sm">
          <thead className="border-b border-gray-300 text-left">
            <tr><th className="py-2">{t.phDescription}</th><th>{t.phQuantity}</th><th>{t.phUnitPrice}</th>{!inv.reverseCharge && <th>{t.invColVat}</th>}<th className="text-right">{t.invColAmount}</th></tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2">{l.description}</td>
                <td>{l.quantity}</td>
                <td>{kr(l.unitPrice)}</td>
                {!inv.reverseCharge && <td>{l.vatRate}%</td>}
                <td className="text-right">{kr(l.quantity * l.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex flex-col items-end gap-1">
          <p>{t.invSubtotal}: {kr(inv.subtotal)} kr</p>
          <p>{t.invColVat}: {inv.reverseCharge ? "0,00 kr" : `${kr(inv.vatTotal)} kr`}</p>
          <p className="text-base font-bold">{t.invToPay}: {kr(inv.total)} kr {inv.currency}</p>
        </div>

        {inv.reverseCharge && (
          <p className="mt-4 rounded bg-gray-100 p-3 text-sm font-medium">{REVERSE_CHARGE_TEXT}</p>
        )}
        {inv.note && <p className="mt-4 text-gray-600">{inv.note}</p>}
      </div>

      <p className="text-xs text-gray-400 print:hidden">
        {t.invViewDisclaimer}
      </p>
    </div>
  );
}
