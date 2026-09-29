import { cache } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { companies, customerInvoices } from "@/db/schema";
import { getUserCompany } from "@/lib/company";
import { PrintButton } from "@/components/PrintButton";
import { InvoicePaidToggle } from "@/components/dashboard/InvoicePaidToggle";
import { canManageCompany } from "@/lib/company";
import { getT } from "@/lib/i18n-server";
import { InvoiceSheet } from "@/components/InvoiceSheet";

export const dynamic = "force-dynamic";

// cache(): generateMetadata and the page share one lookup per request.
const loadInvoice = cache(async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const membership = await getUserCompany(session.user.id);
  if (!membership) redirect("/dashboard/invoices");
  const [inv] = await db
    .select()
    .from(customerInvoices)
    .where(and(eq(customerInvoices.id, id), eq(customerInvoices.companyId, membership.companyId)))
    .limit(1);
  if (!inv) notFound();
  return { inv, membership };
});

// Absolute title: the browser uses it as the PDF filename, so no app branding.
export async function generateMetadata({ params }: { params: { id: string } }) {
  const { inv } = await loadInvoice(params.id);
  return { title: { absolute: `${getT().invSheetNumber} ${inv.invoiceNumber} - ${inv.sellerName}` } };
}

export default async function InvoiceView({ params }: { params: { id: string } }) {
  const { inv, membership } = await loadInvoice(params.id);
  const [company] = await db
    .select({ logoUrl: companies.logoUrl })
    .from(companies)
    .where(eq(companies.id, membership.companyId))
    .limit(1);

  const t = getT();
  const isPaid = inv.status === "paid";
  const canManage = canManageCompany(membership.role);

  return (
    <div className="mx-auto max-w-3xl space-y-6 print:max-w-none">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href="/dashboard/invoices" className="text-sm text-nordic-600 underline">← {t.navInvoices}</Link>
        <div className="flex items-center gap-2">
          {canManage && <InvoicePaidToggle id={inv.id} paid={isPaid} />}
          <PrintButton />
        </div>
      </div>

      <InvoiceSheet inv={inv} t={t} logoUrl={company?.logoUrl} />

      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-xs text-gray-500 print:hidden dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-400">
        <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">{t.invIncomeNoteTitle}</p>
        <p>{t.invIncomeNoteBody}</p>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 print:hidden">
        {t.invViewDisclaimer}
      </p>
    </div>
  );
}
