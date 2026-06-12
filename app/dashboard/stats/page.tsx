import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSek } from "@/lib/utils";
import { getT } from "@/lib/i18n-server";

export const metadata = { title: "Statistik" };
export const dynamic = "force-dynamic";

interface MonthRow {
  month: string;
  count: number;
  amount: number;
}

export default async function StatsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const t = getT();

  const months = (await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${receipts.createdAt}), 'YYYY-MM')`,
      count: sql<number>`count(*)::int`,
      amount: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)::float`,
    })
    .from(receipts)
    .where(eq(receipts.userId, userId))
    .groupBy(sql`date_trunc('month', ${receipts.createdAt})`)
    .orderBy(sql`date_trunc('month', ${receipts.createdAt}) desc`)
    .limit(6)) as MonthRow[];

  const [totals] = await db
    .select({
      totalVat: sql<number>`coalesce(sum(${receipts.vatAmount}), 0)::float`,
      totalAmount: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)::float`,
      count: sql<number>`count(*)::int`,
    })
    .from(receipts)
    .where(eq(receipts.userId, userId));

  const ordered = [...months].reverse();
  const maxCount = Math.max(1, ...ordered.map((m) => Number(m.count)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.navStats}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t.stSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.statTotalReceipts}</p>
            <p className="text-2xl font-semibold">{Number(totals?.count ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.stTotalVat}</p>
            <p className="text-2xl font-semibold">{formatSek(Number(totals?.totalVat ?? 0))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.statTotalAmount}</p>
            <p className="text-2xl font-semibold">{formatSek(Number(totals?.totalAmount ?? 0))}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.stPerMonth}</CardTitle>
          <CardDescription>{t.stLastSixMonths}</CardDescription>
        </CardHeader>
        <CardContent>
          {ordered.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.stNoData}</p>
          ) : (
            <div className="flex items-end gap-3" style={{ height: 180 }}>
              {ordered.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{Number(m.count)}</span>
                  <div
                    className="w-full rounded-t bg-nordic-600"
                    style={{ height: `${(Number(m.count) / maxCount) * 140}px` }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{m.month}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
