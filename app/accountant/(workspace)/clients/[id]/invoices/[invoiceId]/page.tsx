import { cache } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { companies, customerInvoices } from "@/db/schema";
import { requireAccountant, requireCompanyAccess } from "@/lib/accountant";
import { logAuditEvent } from "@/lib/audit";
import { getServerLang, getT } from "@/lib/i18n-server";
import { accountantStrings } from "@/lib/accountant-i18n";
import { InvoiceSheet } from "@/components/InvoiceSheet";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

type Params = { params: { id: string; invoiceId: string } };

// Same gate as GET /api/accountant/clients/[id]/invoices: active relationship
// (+ worker assignment), then the invoice must belong to that company.
// cache(): generateMetadata and the page share one lookup per request.
const loadInvoice = cache(async (companyId: string, invoiceId: string) => {
  const acct = await requireAccountant();
  if (!acct) redirect("/dashboard");
  const access = await requireCompanyAccess(acct.userId, companyId);
  if (!access) notFound();
  const [inv] = await db
    .select()
    .from(customerInvoices)
    .where(and(eq(customerInvoices.id, invoiceId), eq(customerInvoices.companyId, access.companyId)))
    .limit(1);
  if (!inv) notFound();
  return { inv, acct, access };
});

// Absolute title: the browser uses it as the PDF filename, so no app branding.
export async function generateMetadata({ params }: Params) {
  const { inv } = await loadInvoice(params.id, params.invoiceId);
  return { title: { absolute: `${getT().invSheetNumber} ${inv.invoiceNumber} - ${inv.sellerName}` } };
}

export default async function AccountantInvoicePage({ params }: Params) {
  const { inv, acct, access } = await loadInvoice(params.id, params.invoiceId);
  const [company] = await db
    .select({ logoUrl: companies.logoUrl })
    .from(companies)
    .where(eq(companies.id, access.companyId))
    .limit(1);

  void logAuditEvent({
    userId: acct.userId,
    action: "accountant.invoice.view",
    entityType: "customer_invoice",
    entityId: inv.id,
    targetCompanyId: access.companyId,
    ipAddress: headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? headers().get("x-real-ip"),
  });

  const t = accountantStrings(getServerLang());

  return (
    <div className="mx-auto max-w-3xl space-y-6 print:max-w-none">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href={`/accountant/clients/${access.companyId}?tab=invoices`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} /> {t.ivBack}
        </Link>
        <PrintButton />
      </div>

      <InvoiceSheet inv={inv} t={getT()} logoUrl={company?.logoUrl} />

      <p className="text-xs text-gray-500 dark:text-gray-400 print:hidden">{t.ivReadOnly}</p>
    </div>
  );
}
