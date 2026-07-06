import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { bucketForBasCode, type SpendBucket } from "@/lib/stats-categories";

export const runtime = "nodejs";

interface TrendRow {
  bucket: string;
  amount: number;
  count: number;
}
interface CategoryRow {
  basCode: string | null;
  amount: number;
  count: number;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  const userId = session.user.id;
  const sp = req.nextUrl.searchParams;

  // A specific month ("2026-03") or year ("2026") can be requested. If
  // neither is given we default to the current month (backwards compatible
  // with the old ?range=month|year toggle, which is still accepted).
  const monthParam = sp.get("month"); // "YYYY-MM"
  const yearParam = sp.get("year"); // "YYYY"
  const legacyRange = sp.get("range");

  const now = new Date();
  let mode: "month" | "year";
  let periodStart: Date;
  let periodEnd: Date;
  let periodLabel: string;

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    mode = "month";
    periodStart = new Date(Date.UTC(y, m - 1, 1));
    periodEnd = new Date(Date.UTC(y, m, 1));
    periodLabel = monthParam;
  } else if (yearParam && /^\d{4}$/.test(yearParam)) {
    const y = Number(yearParam);
    mode = "year";
    periodStart = new Date(Date.UTC(y, 0, 1));
    periodEnd = new Date(Date.UTC(y + 1, 0, 1));
    periodLabel = yearParam;
  } else if (legacyRange === "year") {
    mode = "year";
    periodStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    periodEnd = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));
    periodLabel = String(now.getUTCFullYear());
  } else {
    mode = "month";
    periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    periodLabel = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  // Filter on the receipt DATE (when the purchase happened) so "March"
  // means what was bought in March, not what was scanned then. Fall back to
  // createdAt for receipts with no date set.
  const periodDate = sql`coalesce(${receipts.date}, ${receipts.createdAt})`;
  const inPeriod = and(
    eq(receipts.userId, userId),
    gte(periodDate, sql`${periodStart.toISOString()}::timestamptz`),
    lt(periodDate, sql`${periodEnd.toISOString()}::timestamptz`),
  );

  try {
    // Trend: the 12 months of the selected year (year mode), or the days of
    // the selected month (month mode). Grouped server-side.
    const trunc = mode === "year" ? "month" : "day";
    const trendFmt = mode === "year" ? "'YYYY-MM'" : "'YYYY-MM-DD'";
    const trendRows = (await db
      .select({
        bucket: sql<string>`to_char(date_trunc(${sql.raw(`'${trunc}'`)}, ${periodDate}), ${sql.raw(trendFmt)})`,
        amount: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(receipts)
      .where(inPeriod)
      .groupBy(sql`date_trunc(${sql.raw(`'${trunc}'`)}, ${periodDate})`)
      .orderBy(sql`date_trunc(${sql.raw(`'${trunc}'`)}, ${periodDate}) asc`)) as TrendRow[];

    // Category breakdown — scoped to the selected period, grouped by the
    // receipt's BAS code and mapped to a spend bucket (food/travel/office/
    // etc.) so the diagram shows named categories for the chosen month/year.
    const categoryRows = (await db
      .select({
        basCode: receipts.basCode,
        amount: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(receipts)
      .where(inPeriod)
      .groupBy(receipts.basCode)) as Array<{ basCode: string | null; amount: number; count: number }>;

    const byBucket = new Map<SpendBucket, { amount: number; count: number }>();
    for (const row of categoryRows) {
      const bucket = bucketForBasCode(row.basCode);
      const prev = byBucket.get(bucket) ?? { amount: 0, count: 0 };
      byBucket.set(bucket, {
        amount: prev.amount + Number(row.amount),
        count: prev.count + Number(row.count),
      });
    }
    const categories = Array.from(byBucket.entries())
      .map(([bucket, v]) => ({ bucket, amount: v.amount, count: v.count }))
      .sort((a, b) => b.amount - a.amount);

    const [totals] = await db
      .select({
        totalAmount: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)::float`,
        totalVat: sql<number>`coalesce(sum(${receipts.vatAmount}), 0)::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(receipts)
      .where(inPeriod);

    const totalAmount = Number(totals?.totalAmount ?? 0);
    const count = Number(totals?.count ?? 0);
    const topCategory = categories[0] ?? null;

    return NextResponse.json({
      range: mode,
      period: periodLabel,
      trend: trendRows.map((r) => ({ bucket: r.bucket, amount: Number(r.amount), count: Number(r.count) })),
      categories,
      kpi: {
        totalAmount,
        totalVat: Number(totals?.totalVat ?? 0),
        count,
        avgPerReceipt: count > 0 ? totalAmount / count : 0,
        topCategory: topCategory ? { bucket: topCategory.bucket, amount: topCategory.amount } : null,
      },
    });
  } catch (e) {
    console.error("stats/overview failed:", e);
    return NextResponse.json(
      { range: mode, period: periodLabel, trend: [], categories: [], kpi: { totalAmount: 0, totalVat: 0, count: 0, avgPerReceipt: 0, topCategory: null } },
      { status: 200 },
    );
  }
}
