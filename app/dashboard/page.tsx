import Link from "next/link";
import { Download } from "lucide-react";
import { getT } from "@/lib/i18n-server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq, sql, desc } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { receipts, users } from "@/db/schema";
import type { Receipt } from "@/db/schema";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentReceipts } from "@/components/dashboard/RecentReceipts";
import { UsageChart } from "@/components/dashboard/UsageChart";

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

  const t = getT();

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

  return (
    <div className="animate-fade-up space-y-8">
      {/* Premium ended notice */}
      {premiumEnded && (
        <div className="flex flex-col gap-4 rounded-2xl border border-amber-200/50 bg-amber-50/60 p-5 backdrop-blur-sm transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/15 dark:bg-amber-950/20">
          <div>
            <p className="mb-0.5 text-[9.5px] font-medium uppercase tracking-[0.16em] text-amber-600/80 dark:text-amber-500/70">
              Prenumeration
            </p>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              {t.dashPremiumEndedTitle}
            </p>
            <p className="mt-0.5 text-sm text-amber-800/60 dark:text-amber-400/60">
              {t.dashPremiumEndedBody}
            </p>
          </div>
          <Link
            href="/dashboard/subscription"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-amber-900 px-5 py-2 text-sm font-medium text-amber-50 transition-colors hover:bg-amber-800 dark:bg-amber-600 dark:text-white dark:hover:bg-amber-500"
          >
            {t.dashChoosePlan}
          </Link>
        </div>
      )}

      {/* Page header */}
      <div>
        <p className="mb-1 text-[9.5px] font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-gray-400">
          {t.navOverview}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {t.dashWelcome}, {firstName}
        </h1>
      </div>

      {/* Export quick action — the one thing people come back for every
          VAT period, so it gets a direct link right on the landing page
          instead of being buried two clicks deep in Settings. */}
      <Link
        href="/dashboard/export"
        className="group flex items-center justify-between rounded-2xl border border-gray-900/[0.07] bg-[#F5F4F0] px-6 py-4 transition-colors hover:border-nordic-600/30 hover:bg-nordic-50/40 dark:border-white/[0.08] dark:bg-[#0D0D0D] dark:hover:bg-white/[0.04]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-nordic-600/10 text-nordic-700 dark:bg-nordic-400/10 dark:text-nordic-300">
            <Download className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{t.navExport}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.dashExportHint}</p>
          </div>
        </div>
        <span className="text-sm font-medium text-nordic-700 transition-transform group-hover:translate-x-0.5 dark:text-nordic-300">
          →
        </span>
      </Link>

      {/* Stats grid */}
      <StatsCards
        totalReceipts={Number(stats?.total ?? 0)}
        thisMonthReceipts={Number(stats?.thisMonth ?? 0)}
        totalAmount={Number(stats?.totalAmount ?? 0)}
        usagePercent={usagePercent}
        planLabel={user.subscriptionTier}
      />

      {/* Charts and recent receipts */}
      <div className="overflow-hidden rounded-2xl border border-gray-900/[0.07] transition-shadow hover:shadow-sm dark:border-white/[0.08]">
        <div className="grid grid-cols-1 gap-px bg-gray-900/[0.07] lg:grid-cols-2 dark:bg-white/[0.07]">
          <div className="bg-[#F5F4F0] px-6 py-5 transition-colors hover:bg-gray-900/[0.02] dark:bg-[#0D0D0D] dark:hover:bg-white/[0.03]">
            <p className="mb-4 text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400 dark:text-gray-400">
              Användning
            </p>
            <UsageChart used={used} limit={limit} />
          </div>
          <div className="bg-[#F5F4F0] px-6 py-5 transition-colors hover:bg-gray-900/[0.02] dark:bg-[#0D0D0D] dark:hover:bg-white/[0.03]">
            <p className="mb-4 text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400 dark:text-gray-400">
              Senaste kvitton
            </p>
            <RecentReceipts receipts={recent} />
          </div>
        </div>
      </div>
    </div>
  );
}