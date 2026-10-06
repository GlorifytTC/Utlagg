import { NextResponse, type NextRequest } from "next/server";
import { and, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { mileageEntries } from "@/db/schema";
import { requireAccountant, requireCompanyAccess } from "@/lib/accountant";
import { logAuditEvent, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * Mileage entries (Milersättning) for one client company, for the accountant.
 * Read-only.
 *
 * AUTHORIZATION - relationship-first, member-scoped, in this exact order:
 *   1. requireAccountant()
 *   2. requireCompanyAccess(accountantId, companyId) -> active relationship +
 *      the company's CURRENT member userIds (null => 404, no data queried)
 *   3. scope by inArray(mileageEntries.userId, memberIds)
 *
 * mileage_entries is member-owned (no companyId column), exactly like receipts,
 * so the member boundary is THE boundary: an entry only appears if its owner is
 * a current member of the authorized company. Manipulating the URL id cannot
 * cross it.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const access = await requireCompanyAccess(acct.userId, params.id);
  if (!access) return NextResponse.json({ error: "Hittades inte" }, { status: 404 });

  if (access.memberIds.length === 0) {
    return NextResponse.json({ entries: [], summary: { count: 0, totalKm: 0, totalAmount: 0 } });
  }

  const entries = await db
    .select({
      id: mileageEntries.id,
      startAddress: mileageEntries.startAddress,
      endAddress: mileageEntries.endAddress,
      distanceKm: mileageEntries.distanceKm,
      ratePerKm: mileageEntries.ratePerKm,
      amount: mileageEntries.amount,
      date: mileageEntries.date,
      purpose: mileageEntries.purpose,
      note: mileageEntries.note,
    })
    .from(mileageEntries)
    .where(inArray(mileageEntries.userId, access.memberIds))
    .orderBy(desc(mileageEntries.date));

  const round = (n: number) => Math.round(n * 100) / 100;
  type Entry = (typeof entries)[number];
  const summary = {
    count: entries.length,
    totalKm: round(entries.reduce((s: number, e: Entry) => s + (Number(e.distanceKm) || 0), 0)),
    totalAmount: round(entries.reduce((s: number, e: Entry) => s + (Number(e.amount) || 0), 0)),
  };

  void logAuditEvent({
    userId: acct.userId,
    action: "accountant.mileage.list",
    entityType: "company",
    entityId: access.companyId,
    targetCompanyId: access.companyId,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ entries, summary });
}
