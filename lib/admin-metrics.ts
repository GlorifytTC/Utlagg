import { sql, gte, like, and } from "drizzle-orm";
import { db } from "@/db";
import { users, receipts, auditLogs } from "@/db/schema";

const PRICE: Record<string, number> = { free: 0, pro: 149, business: 299, enterprise: 0 };

export interface Metrics {
  totalUsers: number;
  payingCustomers: number;
  mrr: number;
  arr: number;
  arpu: number;
  churnApprox: number; // 0..1, approximate
  ltvApprox: number | null; // null when churn is 0
  byTier: Record<string, number>;
}

export async function computeMetrics(): Promise<Metrics> {
  const tierRows = (await db
    .select({ tier: users.subscriptionTier, count: sql<number>`count(*)::int` })
    .from(users)
    .groupBy(users.subscriptionTier)) as { tier: string; count: number }[];

  const byTier: Record<string, number> = { free: 0, pro: 0, business: 0, enterprise: 0 };
  let totalUsers = 0;
  for (const r of tierRows) {
    byTier[r.tier] = Number(r.count);
    totalUsers += Number(r.count);
  }

  const payingCustomers = byTier.pro + byTier.business;
  const mrr = byTier.pro * PRICE.pro + byTier.business * PRICE.business;
  const arr = mrr * 12;
  const arpu = payingCustomers > 0 ? mrr / payingCustomers : 0;

  // Approximate churn: cancellations in the last 30 days over (active paid + those cancellations).
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [{ canceled }] = (await db
    .select({ canceled: sql<number>`count(*)::int` })
    .from(auditLogs)
    .where(
      and(like(auditLogs.action, "subscription.cancel%"), gte(auditLogs.createdAt, since)),
    )) as { canceled: number }[];

  const churnDenom = payingCustomers + Number(canceled);
  const churnApprox = churnDenom > 0 ? Number(canceled) / churnDenom : 0;
  const ltvApprox = churnApprox > 0 ? arpu / churnApprox : null;

  return { totalUsers, payingCustomers, mrr, arr, arpu, churnApprox, ltvApprox, byTier };
}

/** Monthly counts of new signups and receipts (last 12 months), oldest first. */
export async function monthlySeries() {
  const signups = (await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${users.createdAt}), 'YYYY-MM')`,
      count: sql<number>`count(*)::int`,
    })
    .from(users)
    .groupBy(sql`date_trunc('month', ${users.createdAt})`)
    .orderBy(sql`date_trunc('month', ${users.createdAt})`)) as {
    month: string;
    count: number;
  }[];

  const receiptsByMonth = (await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${receipts.createdAt}), 'YYYY-MM')`,
      count: sql<number>`count(*)::int`,
    })
    .from(receipts)
    .groupBy(sql`date_trunc('month', ${receipts.createdAt})`)
    .orderBy(sql`date_trunc('month', ${receipts.createdAt})`)) as {
    month: string;
    count: number;
  }[];

  return { signups, receiptsByMonth };
}
