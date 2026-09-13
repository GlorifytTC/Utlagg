import { NextResponse } from "next/server";
import { and, eq, inArray, isNull, or, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { accountantClients, companies, companyMembers, receipts } from "@/db/schema";
import { requireAccountant } from "@/lib/accountant";

export const runtime = "nodejs";

const LOW_CONFIDENCE = 0.6;

/**
 * "Att göra" work-queue summary for the accountant dashboard. Every number is
 * REAL, computed from the accountant's active clients' receipts:
 *   - toReview:      reviewed_at IS NULL          (not yet reviewed)
 *   - missingInfo:   vat_amount / bas_code / category NULL
 *   - lowConfidence: ai_confidence < 0.6          (uncertain OCR read)
 *   - pending:       status = 'pending'
 * Plus a per-client breakdown, sorted most-needing-attention first.
 *
 * AUTHORIZATION: requireAccountant() → only status='active' relationships →
 * receipts scoped to each client company's CURRENT members (never companyId).
 */
export async function GET() {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  // Active client companies for this accountant.
  const clients = await db
    .select({ companyId: accountantClients.companyId, companyName: companies.name })
    .from(accountantClients)
    .innerJoin(companies, eq(companies.id, accountantClients.companyId))
    .where(and(eq(accountantClients.accountantId, acct.userId), eq(accountantClients.status, "active")));

  if (clients.length === 0) {
    return NextResponse.json({
      totals: { toReview: 0, missingInfo: 0, lowConfidence: 0, pending: 0 },
      clients: [],
      activity: { reviewedWeek: 0, reviewedMonth: 0 },
    });
  }

  const companyIds = clients.map((c: { companyId: string }) => c.companyId);

  // CURRENT members per company (the scope for receipts).
  const members = await db
    .select({ companyId: companyMembers.companyId, userId: companyMembers.userId })
    .from(companyMembers)
    .where(inArray(companyMembers.companyId, companyIds));
  const membersByCompany = new Map<string, string[]>();
  for (const m of members) {
    const list = membersByCompany.get(m.companyId) ?? [];
    list.push(m.userId);
    membersByCompany.set(m.companyId, list);
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
  for (const c of clients as Array<{ companyId: string; companyName: string }>) {
    const memberIds = membersByCompany.get(c.companyId) ?? [];
    if (memberIds.length === 0) {
      perClient.push({ companyId: c.companyId, companyName: c.companyName, toReview: 0, missingInfo: 0, lowConfidence: 0, pending: 0, attention: 0 });
      continue;
    }
    const [row] = await db
      .select({
        toReview: sql<number>`count(*) filter (where ${receipts.reviewedAt} is null)::int`,
        missingInfo: sql<number>`count(*) filter (where ${receipts.vatAmount} is null or ${receipts.basCode} is null or ${receipts.category} is null)::int`,
        lowConfidence: sql<number>`count(*) filter (where ${receipts.aiConfidence} is not null and ${receipts.aiConfidence} < ${LOW_CONFIDENCE})::int`,
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
  const allMemberIds: string[] = Array.from(new Set(members.map((m: { userId: string }) => m.userId)));
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
