import { NextResponse, type NextRequest } from "next/server";
import { count, inArray } from "drizzle-orm";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { requireAccountant, requireCompanyAccess } from "@/lib/accountant";

export const runtime = "nodejs";

/**
 * Client (company) detail for the accountant. [id] is the COMPANY id.
 *
 * AUTHORIZATION (relationship-first, member-scoped):
 *   1. requireAccountant()
 *   2. requireCompanyAccess(accountantId, companyId) — active relationship only
 *   3. counts are scoped to the company's CURRENT members
 *
 * Returns 404 (not 403) when the accountant has no active relationship with
 * the company, so it never reveals whether the company exists. Only minimal,
 * accountant-relevant fields are returned — no member list, billing,
 * subscription, credential, or private data.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const access = await requireCompanyAccess(acct.userId, params.id);
  if (!access) {
    // Do not reveal existence — same 404 whether the company is unknown or
    // simply not this accountant's client.
    return NextResponse.json({ error: "Hittades inte" }, { status: 404 });
  }

  const memberIds = access.memberIds;

  const receiptCount =
    memberIds.length === 0
      ? 0
      : Number(
          (
            await db
              .select({ total: count() })
              .from(receipts)
              .where(inArray(receipts.userId, memberIds))
          )[0]?.total ?? 0,
        );

  return NextResponse.json({
    companyId: access.companyId,
    companyName: access.companyName,
    receiptCount,
  });
}
