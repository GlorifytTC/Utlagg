import Link from "next/link";
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

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) redirect("/login");
  const t = getT();

  let stats: { total: number; thisMonth: number; totalAmount: number } | undefined;
  let recent: Receipt[] = [];
  try {
    [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        thisMonth: sql<number>`count(case when date_trunc('month', ${receipts.createdAt}) = date_trunc('month', now()) then 1 end)::int`,
        totalAmount: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)::float`,
      })
      .from(receipts)
      .where(eq(receipts.userId, userId));

    recent = (await db
      .select()
      .from(receipts)
      .where(eq(receipts.userId, userId))
      .orderBy(desc(receipts.createdAt))
      .limit(5)) as Receipt[];
  } catch (e) {
    // Don't let a transient DB/schema issue crash the whole dashboard render.
    console.error("dashboard overview query failed:", e);
  }

  const limit = user.scanLimit as number;
  const used = user.scansUsedThisMonth as number;
  const usagePercent =
    limit === -1 ? -1 : Math.min(100, (used / Math.max(1, limit)) * 100);

  return (
    <div className="space-y-6">
      {(() => {
        const grantExpired = user.subscriptionGrantedUntil
          ? new Date(user.subscriptionGrantedUntil).getTime() < Date.now()
          : false;
        const premiumEnded =
          user.subscriptionPaused ||
          grantExpired ||
          (user.subscriptionTier === "free" && user.subscriptionStatus === "canceled");
        if (!premiumEnded) return null;
        return (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/40 dark:bg-amber-500/10">
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                {t.dashPremiumEndedTitle}
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300/90">
                {t.dashPremiumEndedBody}
              </p>
            </div>
            <Link
              href="/dashboard/subscription"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              {t.dashChoosePlan}
            </Link>
          </div>
        );
      })()}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.navOverview}</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t.dashWelcome}, {user.name ?? user.email}
        </p>
      </div>

      <StatsCards
        totalReceipts={Number(stats?.total ?? 0)}
        thisMonthReceipts={Number(stats?.thisMonth ?? 0)}
        totalAmount={Number(stats?.totalAmount ?? 0)}
        usagePercent={usagePercent}
        planLabel={user.subscriptionTier}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UsageChart used={used} limit={limit} />
        <RecentReceipts receipts={recent} />
      </div>
    </div>
  );
}
