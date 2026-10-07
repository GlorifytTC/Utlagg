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
import { getT, getServerLang } from "@/lib/i18n-server";
import { formatSek, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
  const lang = getServerLang();

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
            <CardTitle as="h2">{t.invNeedCompanyTitle}</CardTitle>
            <CardDescription>{t.invNeedCompanyDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings/company" className={buttonClass()}>{t.btnToCompanies}</Link>
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

  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader
        title={t.navInvoices}
        actions={<Link href="/dashboard/invoices/new" className={buttonClass()}>{t.btnNewInvoice}</Link>}
      />

      {rows.length > 0 && (
        <StatGrid
          items={[
            { label: t.invSumIncomeLabel, value: formatSek(summary.incomeNet), hint: t.invSumIncomeHint },
            { label: t.invSumVatLabel, value: formatSek(summary.vatToRemit), hint: t.invSumVatHint },
            {
              label: t.invSumOutstandingLabel,
              value: formatSek(summary.outstandingGross),
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
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="border-b border-gray-900/[0.07] text-left text-xs font-medium text-gray-500 dark:border-white/[0.08] dark:text-gray-400">
                    <tr>
                      {[t.invColNr, t.invColCustomer, t.invColDate, t.invColAmount, t.invColVat, t.invColStatus, ""].map((h, i) => (
                        <th key={i} scope="col" className="px-3 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900/[0.06] dark:divide-white/[0.07]">
                    {rows.map((r: Record<string, unknown>) => (
                      <tr key={r.id as string} className="dark:text-gray-100">
                        <td className="whitespace-nowrap px-3 py-3 font-medium">{r.invoiceNumber as string}</td>
                        <td className="max-w-[16rem] truncate px-3 py-3" title={r.buyerName as string}>{r.buyerName as string}</td>
                        <td className="whitespace-nowrap px-3 py-3">{formatDate(r.issueDate as string, lang)}</td>
                        <td className="whitespace-nowrap px-3 py-3 tabular-nums">{formatSek(Number(r.total))}</td>
                        <td className="whitespace-nowrap px-3 py-3 tabular-nums">{(r.reverseCharge as boolean) ? t.invReverse : formatSek(Number(r.vatTotal))}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {r.status === "paid" ? (
                              <Badge tone="success">{t.invBadgePaid}</Badge>
                            ) : (
                              <Badge tone="warning">{t.invBadgeUnpaid}</Badge>
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

              <ul className="divide-y divide-gray-900/[0.06] dark:divide-white/[0.07] md:hidden">
                {rows.map((r: Record<string, unknown>) => (
                  <li key={r.id as string} className="space-y-3 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium" title={r.buyerName as string}>{r.buyerName as string}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {r.invoiceNumber as string} · {formatDate(r.issueDate as string, lang)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-medium tabular-nums">{formatSek(Number(r.total))}</p>
                        <p className="text-xs text-gray-500 tabular-nums dark:text-gray-400">
                          {t.invColVat}: {(r.reverseCharge as boolean) ? t.invReverse : formatSek(Number(r.vatTotal))}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {r.status === "paid" ? (
                        <Badge tone="success">{t.invBadgePaid}</Badge>
                      ) : (
                        <Badge tone="warning">{t.invBadgeUnpaid}</Badge>
                      )}
                      {canManage && <InvoicePaidToggle id={r.id as string} paid={r.status === "paid"} variant="inline" />}
                      <div className="ml-auto flex items-center gap-2">
                        <Link href={`/dashboard/invoices/${r.id}`} className="inline-flex min-h-11 items-center text-sm font-medium text-nordic-600 transition hover:text-nordic-700 dark:text-nordic-300">{t.btnView}</Link>
                        <DeleteInvoiceButton
                          id={r.id as string}
                          confirmText={t.invDeleteConfirm}
                          label={t.btnDelete}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t.invDisclaimer}
      </p>
    </div>
  );
}
