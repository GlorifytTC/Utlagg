import Link from "next/link";
import { ArrowUpRight, Building2, Download, Store, Upload } from "lucide-react";
import { getT } from "@/lib/i18n-server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq, sql, desc } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { companies, receipts, users } from "@/db/schema";
import type { Receipt } from "@/db/schema";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentReceipts } from "@/components/dashboard/RecentReceipts";
import { UsageChart } from "@/components/dashboard/UsageChart";
import { AccountantEntryLink } from "@/components/accountant/AccountantEntryLink";
import { DashboardAccountantAccess } from "@/components/dashboard/DashboardAccountantAccess";
import { getUserCompany } from "@/lib/company";
import { loadReceiptPeople } from "@/lib/receipts/people";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Översikt" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) redirect("/login");

  // Accountants get their own role-based workspace, not the business-owner
  // dashboard (with its scan/upload tools). Read server-side from the DB flag;
  // the browser never decides this. Normal users fall through to /dashboard.
  if (user.isAccountant) redirect("/accountant");

  const t = getT();

  const membership = await getUserCompany(userId);
  const [company] = membership
    ? await db.select({ name: companies.name, logoUrl: companies.logoUrl }).from(companies).where(eq(companies.id, membership.companyId)).limit(1)
    : [];

  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      thisMonth: sql<number>`count(case when date_trunc('month', ${receipts.createdAt}) = date_trunc('month', now()) then 1 end)::int`,
      totalAmount: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)::float`,
    })
    .from(receipts)
    .where(eq(receipts.userId, userId));

  const recent = (await db
    .select()
    .from(receipts)
    .where(eq(receipts.userId, userId))
    .orderBy(desc(receipts.createdAt))
    .limit(5)) as Receipt[];
  const recentPeople = await loadReceiptPeople(recent);

  const limit = user.scanLimit as number;
  const used = user.scansUsedThisMonth as number;
  const usagePercent = limit === -1 ? -1 : Math.min(100, (used / Math.max(1, limit)) * 100);

  const grantExpired = user.subscriptionGrantedUntil
    ? new Date(user.subscriptionGrantedUntil).getTime() < Date.now()
    : false;
  const premiumEnded =
    user.subscriptionPaused ||
    grantExpired ||
    (user.subscriptionTier === "free" && user.subscriptionStatus === "canceled");

  const firstName = user.name?.split(" ")[0] ?? user.email;

  const gettingStarted = [
    { href: "/dashboard/receipts", icon: Upload, title: t.dashGsReceipt, sub: t.dashGsSub1 },
    { href: "/dashboard/settings/company", icon: Building2, title: t.dashGsCompany, sub: t.dashGsSub2 },
    { href: "/dashboard/marketplace", icon: Store, title: t.dashGsMarketplace, sub: t.dashGsSub3 },
  ];

  return (
    <div className="max-w-6xl animate-fade-up space-y-6">
      {/* Premium ended notice */}
      {premiumEnded && (
        <div className="flex flex-col gap-4 rounded-2xl border border-amber-300/40 bg-amber-50/80 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/15 dark:bg-amber-950/20">
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              {t.dashPremiumEndedTitle}
            </p>
            <p className="mt-0.5 text-sm text-amber-800/75 dark:text-amber-300/70">
              {t.dashPremiumEndedBody}
            </p>
          </div>
          <Link
            href="/dashboard/settings/billing"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-amber-900 px-5 py-2.5 text-sm font-medium text-amber-50 transition duration-300 ease-premium hover:bg-amber-800 active:scale-[0.98] dark:bg-amber-600 dark:text-white dark:hover:bg-amber-500"
          >
            {t.dashChoosePlan}
          </Link>
        </div>
      )}

      <PageHeader
        title={`${t.dashWelcome}, ${firstName}`}
        subtitle={company?.name}
        leading={
          company?.logoUrl && (
            // Light tile keeps dark-on-transparent logos legible in dark mode.
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-gray-900/[0.08] bg-white p-1.5 sm:h-14 sm:w-14 dark:border-white/10">
              <img src={company.logoUrl} alt={company.name} className="max-h-full max-w-full object-contain" />
            </span>
          )
        }
        actions={<AccountantEntryLink />}
      />

      {Number(stats?.total ?? 0) === 0 && !premiumEnded && (
        <section className="rounded-2xl bg-nordic-50 p-6 dark:bg-nordic-600/[0.06]">
          <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
            {t.dashGettingStartedTitle}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {gettingStarted.map(({ href, icon: Icon, title, sub }) => (
              <Link
                key={href}
                href={href}
                className="panel group flex items-start gap-3 rounded-xl p-4 transition duration-300 ease-premium hover:border-nordic-600/30 active:scale-[0.99]"
              >
                <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-nordic-600" strokeWidth={1.75} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">{title}</span>
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{sub}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <StatsCards
        totalReceipts={Number(stats?.total ?? 0)}
        thisMonthReceipts={Number(stats?.thisMonth ?? 0)}
        totalAmount={Number(stats?.totalAmount ?? 0)}
        usagePercent={usagePercent}
      />

      {/* Recent activity on the left, usage and quick actions on the right */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <RecentReceipts receipts={recent} people={recentPeople} />
        </div>
        <div className="space-y-5 lg:col-span-5">
          <UsageChart used={used} limit={limit} />

          {/* Export: the one thing people come back for every VAT period, so it
              gets a direct link here instead of two clicks deep in Settings. */}
          <Link
            href="/dashboard/export"
            className="panel group flex items-center gap-4 rounded-2xl p-5 transition duration-300 ease-premium hover:border-nordic-600/30 active:scale-[0.99]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-nordic-600/10 text-nordic-700 dark:text-nordic-300">
              <Download className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-gray-900 dark:text-white">{t.navExport}</span>
              <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">{t.dashExportHint}</span>
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400 transition duration-300 ease-premium group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:text-nordic-600" strokeWidth={1.75} />
          </Link>

          <DashboardAccountantAccess />
        </div>
      </div>
    </div>
  );
}