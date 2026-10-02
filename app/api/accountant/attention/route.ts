import { NextResponse } from "next/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { getClientScope, requireAccountant } from "@/lib/accountant";
import { LOW_CONFIDENCE } from "@/lib/accountant-receipts";

export const runtime = "nodejs";

/**
 * "Att göra" work-queue summary for the accountant dashboard. Every number is
 * REAL, computed from the accountant's active clients' receipts:
 *   - toReview:      reviewed_at IS NULL          (not yet reviewed)
 *   - missingInfo:   vat_amount / bas_code / category NULL
 *   - lowConfidence: unreviewed AND ai_confidence < 0.6 (uncertain OCR read)
 *   - pending:       status = 'pending'
 * Plus a per-client breakdown, sorted most-needing-attention first.
 *
 * AUTHORIZATION: requireAccountant() → only status='active' relationships →
 * receipts scoped to each client company's CURRENT members (never companyId).
 */
export async function GET() {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const { clients, membersByCompany } = await getClientScope(acct.userId);

  if (clients.length === 0) {
    return NextResponse.json({
      totals: { toReview: 0, missingInfo: 0, lowConfidence: 0, pending: 0 },
      clients: [],
      activity: { reviewedWeek: 0, reviewedMonth: 0 },
    });
  }

  const totals = { toReview: 0, missingInfo: 0, lowConfidence: 0, pending: 0 };
  const perClient: Array<{
    companyId: string;
    companyName: string;
    toReview: number;
    missingInfo: number;
    lowConfidence: number;
    pending: number;
    attention: number;
  }> = [];

  // Accountants have tens of clients, so a bounded per-client aggregate is fine.
  for (const c of clients) {
    const memberIds = membersByCompany.get(c.companyId) ?? [];
    if (memberIds.length === 0) {
      perClient.push({ companyId: c.companyId, companyName: c.companyName, toReview: 0, missingInfo: 0, lowConfidence: 0, pending: 0, attention: 0 });
      continue;
    }
    const [row] = await db
      .select({
        toReview: sql<number>`count(*) filter (where ${receipts.reviewedAt} is null)::int`,
        missingInfo: sql<number>`count(*) filter (where ${receipts.vatAmount} is null or ${receipts.basCode} is null or ${receipts.category} is null)::int`,
        lowConfidence: sql<number>`count(*) filter (where ${receipts.reviewedAt} is null and ${receipts.aiConfidence} is not null and ${receipts.aiConfidence} < ${LOW_CONFIDENCE})::int`,
        pending: sql<number>`count(*) filter (where ${receipts.status} = 'pending')::int`,
      })
      .from(receipts)
      .where(inArray(receipts.userId, memberIds));

    const toReview = Number(row?.toReview ?? 0);
    const missingInfo = Number(row?.missingInfo ?? 0);
    const lowConfidence = Number(row?.lowConfidence ?? 0);
    const pending = Number(row?.pending ?? 0);
    totals.toReview += toReview;
    totals.missingInfo += missingInfo;
    totals.lowConfidence += lowConfidence;
    totals.pending += pending;
    perClient.push({
      companyId: c.companyId,
      companyName: c.companyName,
      toReview,
      missingInfo,
      lowConfidence,
      pending,
      // A single "how much attention" score for sorting (unreviewed weighted highest).
      attention: toReview * 3 + missingInfo * 2 + lowConfidence + pending,
    });
  }

  perClient.sort((a, b) => b.attention - a.attention);

  // Real activity: receipts this accountant reviewed recently, across all
  // current members of their active clients. reviewed_by = this accountant.
  const allMemberIds = Array.from(new Set(Array.from(membersByCompany.values()).flat()));
  let reviewedWeek = 0;
  let reviewedMonth = 0;
  if (allMemberIds.length > 0) {
    const [act] = await db
      .select({
        week: sql<number>`count(*) filter (where ${receipts.reviewedAt} >= now() - interval '7 days')::int`,
        month: sql<number>`count(*) filter (where ${receipts.reviewedAt} >= now() - interval '30 days')::int`,
      })
      .from(receipts)
      .where(and(inArray(receipts.userId, allMemberIds), eq(receipts.reviewedBy, acct.userId)));
    reviewedWeek = Number(act?.week ?? 0);
    reviewedMonth = Number(act?.month ?? 0);
  }

  return NextResponse.json({
    totals,
    clients: perClient,
    activity: { reviewedWeek, reviewedMonth },
  });
}
