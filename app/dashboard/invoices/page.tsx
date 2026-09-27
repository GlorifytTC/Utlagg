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
import { Button } from "@/components/ui/button";
import { UpsellCard } from "@/components/UpsellCard";
import { DeleteInvoiceButton } from "@/components/dashboard/DeleteInvoiceButton";
import { InvoicePaidToggle } from "@/components/dashboard/InvoicePaidToggle";

export const metadata = { title: "Fakturor" };
export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const t = getT();

  const ctx = await currentTier();
  if (!ctx || !hasFeature(ctx.tier, "invoicing")) {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="font-display text-2xl font-semibold text-gray-900 dark:text-white">{t.navInvoices}</h1>
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
      <div className="max-w-2xl space-y-6">
        <h1 className="font-display text-2xl font-semibold text-gray-900 dark:text-white">{t.navInvoices}</h1>
        <Card>
          <CardHeader>
            <CardTitle>{t.invNeedCompanyTitle}</CardTitle>
            <CardDescription>{t.invNeedCompanyDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/company"><Button>{t.btnToCompanies}</Button></Link>
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
  const currentYear = new Date().getFullYear();
  // Income recognition is per calendar year and cash-method: only invoices
  // paid this year count as income, and only their net (excl. VAT).
  const paidThisYear = rows.filter(
    (r: Record<string, unknown>) =>
      r.status === "paid" && r.paidAt != null && new Date(r.paidAt as string).getFullYear() === currentYear,
  );
  const summary = summarizeInvoiceIncome([
    ...(paidThisYear as unknown as InvoiceLike[]),
    ...(rows.filter((r: Record<string, unknown>) => r.status !== "paid") as unknown as InvoiceLike[]),
  ]);
  const money = (n: number) => n.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-gray-900 dark:text-white">{t.navInvoices}</h1>
        <Link href="/dashboard/invoices/new"><Button>{t.btnNewInvoice}</Button></Link>
      </div>

      {rows.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-900/[0.07] bg-white/70 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{t.invSumIncomeLabel}</p>
            <p className="mt-1 text-xl font-semibold text-emerald-700 dark:text-emerald-400">{money(summary.incomeNet)} kr</p>
            <p className="mt-0.5 text-xs text-gray-400">{t.invSumIncomeHint.replace("{year}", String(currentYear))}</p>
          </div>
          <div className="rounded-2xl border border-gray-900/[0.07] bg-white/70 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{t.invSumVatLabel}</p>
            <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{money(summary.vatToRemit)} kr</p>
            <p className="mt-0.5 text-xs text-gray-400">{t.invSumVatHint}</p>
          </div>
          <div className="rounded-2xl border border-gray-900/[0.07] bg-white/70 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{t.invSumOutstandingLabel}</p>
            <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{money(summary.outstandingGross)} kr</p>
            <p className="mt-0.5 text-xs text-gray-400">{t.invSumOutstandingHint.replace("{count}", String(summary.outstandingCount))}</p>
          </div>
        </div>
      )}
      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-gray-500 dark:text-gray-400">{t.invNoneYet}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-gray-50 text-left text-gray-500 dark:bg-[#111] dark:text-gray-400">
                  <tr><th className="px-4 py-3">{t.invColNr}</th><th>{t.invColCustomer}</th><th>{t.invColDate}</th><th>{t.invColAmount}</th><th>{t.invColVat}</th><th>{t.invColStatus}</th><th></th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.07]">
                  {rows.map((r: Record<string, unknown>) => (
                    <tr key={r.id as string} className="dark:text-gray-100">
                      <td className="px-4 py-3 font-medium">{r.invoiceNumber as string}</td>
                      <td>{r.buyerName as string}</td>
                      <td>{new Date(r.issueDate as string).toLocaleDateString("sv-SE")}</td>
                      <td>{Number(r.total).toFixed(2).replace(".", ",")} kr</td>
                      <td>{(r.reverseCharge as boolean) ? t.invReverse : `${Number(r.vatTotal).toFixed(2).replace(".", ",")} kr`}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {r.status === "paid" ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">{t.invBadgePaid}</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">{t.invBadgeUnpaid}</span>
                          )}
                          {canManage && <InvoicePaidToggle id={r.id as string} paid={r.status === "paid"} variant="inline" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/invoices/${r.id}`} className="text-nordic-600 underline text-sm dark:text-nordic-300">{t.btnView}</Link>
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
      <p className="text-xs text-gray-400">
        {t.invDisclaimer}
      </p>
    </div>
  );
}
