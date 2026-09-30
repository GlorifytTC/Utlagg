import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { customerInvoices } from "@/db/schema";
import { currentTier } from "@/lib/entitlements";
import { hasFeature } from "@/lib/features";
import { getUserCompany, canManageCompany } from "@/lib/company";
import { getT } from "@/lib/i18n-server";
import { summarizeInvoiceIncome, type InvoiceLike } from "@/lib/invoice-income";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { UpsellCard } from "@/components/UpsellCard";
import { DeleteInvoiceButton } from "@/components/dashboard/DeleteInvoiceButton";
import { InvoicePaidToggle } from "@/components/dashboard/InvoicePaidToggle";
import { PageHeader } from "@/components/ui/page-header";
import { StatGrid } from "@/components/ui/stat";

export const metadata = { title: "Fakturor" };
export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const t = getT();

  const ctx = await currentTier();
  if (!ctx || !hasFeature(ctx.tier, "invoicing")) {
    return (
      <div className="max-w-3xl space-y-6">
        <PageHeader title={t.navInvoices} />
        <UpsellCard
          title={t.invUpsellTitle}
          requiredPlan="Pro"
          description={t.invUpsellDesc}
        />
      </div>
    );
  }

  const membership = await getUserCompany(session.user.id);
  if (!membership) {
    return (
      <div className="max-w-3xl space-y-6">
        <PageHeader title={t.navInvoices} />
        <Card>
          <CardHeader>
            <CardTitle>{t.invNeedCompanyTitle}</CardTitle>
            <CardDescription>{t.invNeedCompanyDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/company" className={buttonClass()}>{t.btnToCompanies}</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rows = await db
    .select()
    .from(customerInvoices)
    .where(eq(customerInvoices.companyId, membership.companyId))
    .orderBy(desc(customerInvoices.issueDate));

  const canManage = canManageCompany(membership.role);
  // Cash-method income recognition: only paid invoices count as income, and
  // only their net (excl. VAT). Unpaid invoices are outstanding receivables.
  const summary = summarizeInvoiceIncome(rows as unknown as InvoiceLike[]);
  const money = (n: number) => n.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader
        title={t.navInvoices}
        actions={<Link href="/dashboard/invoices/new" className={buttonClass()}>{t.btnNewInvoice}</Link>}
      />

      {rows.length > 0 && (
        <StatGrid
          items={[
            { label: t.invSumIncomeLabel, value: `${money(summary.incomeNet)} kr`, hint: t.invSumIncomeHint },
            { label: t.invSumVatLabel, value: `${money(summary.vatToRemit)} kr`, hint: t.invSumVatHint },
            {
              label: t.invSumOutstandingLabel,
              value: `${money(summary.outstandingGross)} kr`,
              hint: t.invSumOutstandingHint.replace("{count}", String(summary.outstandingCount)),
              tone: summary.outstandingCount > 0 ? "warn" : "default",
            },
          ]}
        />
      )}
      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-gray-500 dark:text-gray-400">{t.invNoneYet}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-gray-900/[0.07] text-left text-xs font-medium text-gray-500 dark:border-white/[0.08] dark:text-gray-400">
                  <tr>
                    {[t.invColNr, t.invColCustomer, t.invColDate, t.invColAmount, t.invColVat, t.invColStatus, ""].map((h, i) => (
                      <th key={i} className="px-3 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900/[0.06] dark:divide-white/[0.07]">
                  {rows.map((r: Record<string, unknown>) => (
                    <tr key={r.id as string} className="dark:text-gray-100">
                      <td className="whitespace-nowrap px-3 py-3 font-medium">{r.invoiceNumber as string}</td>
                      <td className="px-3 py-3">{r.buyerName as string}</td>
                      <td className="whitespace-nowrap px-3 py-3">{new Date(r.issueDate as string).toLocaleDateString("sv-SE")}</td>
                      <td className="whitespace-nowrap px-3 py-3 tabular-nums">{Number(r.total).toFixed(2).replace(".", ",")} kr</td>
                      <td className="whitespace-nowrap px-3 py-3 tabular-nums">{(r.reverseCharge as boolean) ? t.invReverse : `${Number(r.vatTotal).toFixed(2).replace(".", ",")} kr`}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {r.status === "paid" ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">{t.invBadgePaid}</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">{t.invBadgeUnpaid}</span>
                          )}
                          {canManage && <InvoicePaidToggle id={r.id as string} paid={r.status === "paid"} variant="inline" />}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/invoices/${r.id}`} className="text-sm font-medium text-nordic-600 transition hover:text-nordic-700 dark:text-nordic-300">{t.btnView}</Link>
                          <DeleteInvoiceButton
                            id={r.id as string}
                            confirmText={t.invDeleteConfirm}
                            label={t.btnDelete}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t.invDisclaimer}
      </p>
    </div>
  );
}
