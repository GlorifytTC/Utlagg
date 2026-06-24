import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq, gte, sql } from "drizzle-orm";
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
  const range = req.nextUrl.searchParams.get("range") === "year" ? "year" : "month";

  try {
    // Trend: last 12 months, or last 6 years — grouped server-side so the
    // chart never has to fetch/aggregate raw rows in the browser.
    const trunc = range === "year" ? "year" : "month";
    const lookback = range === "year" ? "6 years" : "12 months";

    const trendRows = (await db
      .select({
        bucket: sql<string>`to_char(date_trunc(${sql.raw(`'${trunc}'`)}, ${receipts.createdAt}), ${sql.raw(
          range === "year" ? "'YYYY'" : "'YYYY-MM'",
        )})`,
        amount: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(receipts)
      .where(
        and(
          eq(receipts.userId, userId),
          gte(receipts.createdAt, sql`now() - interval '${sql.raw(lookback)}'`),
        ),
      )
      .groupBy(sql`date_trunc(${sql.raw(`'${trunc}'`)}, ${receipts.createdAt})`)
      .orderBy(sql`date_trunc(${sql.raw(`'${trunc}'`)}, ${receipts.createdAt}) asc`)) as TrendRow[];

    // Category breakdown: group by the structured bas_code, bucket in JS
    // (only ~26 possible codes, so this is cheap and keeps the SQL simple).
    const categoryRows = (await db
      .select({
        basCode: receipts.basCode,
        amount: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(receipts)
      .where(eq(receipts.userId, userId))
      .groupBy(receipts.basCode)) as CategoryRow[];

    const byBucket = new Map<SpendBucket, { amount: number; count: number }>();
    for (const row of categoryRows) {
      const bucket = bucketForBasCode(row.basCode);
      const prev = byBucket.get(bucket) ?? { amount: 0, count: 0 };
      byBucket.set(bucket, { amount: prev.amount + Number(row.amount), count: prev.count + Number(row.count) });
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
      .where(eq(receipts.userId, userId));

    const totalAmount = Number(totals?.totalAmount ?? 0);
    const count = Number(totals?.count ?? 0);
    const topCategory = categories[0] ?? null;

    return NextResponse.json({
      range,
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
      { range, trend: [], categories: [], kpi: { totalAmount: 0, totalVat: 0, count: 0, avgPerReceipt: 0, topCategory: null } },
      { status: 200 },
    );
  }
}
