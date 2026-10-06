import { NextResponse, type NextRequest } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { transportPasses } from "@/db/schema";
import { requireAccountant, requireCompanyAccess } from "@/lib/accountant";
import { logAuditEvent, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * Public-transport passes (Periodbiljetter / kollektivtrafik) for one client
 * company, for the accountant. Read-only.
 *
 * AUTHORIZATION - relationship-first, member-scoped, in this exact order:
 *   1. requireAccountant()
 *   2. requireCompanyAccess(accountantId, companyId) -> active relationship +
 *      the company's CURRENT member userIds (null => 404, no data queried)
 *   3. scope by inArray(transportPasses.userId, memberIds)
 *
 * A pass carries an optional companyId (company-paid), but the authorization
 * boundary is member ownership - identical to receipts and mileage - so a pass
 * only appears if its owner is a current member of the authorized company.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const access = await requireCompanyAccess(acct.userId, params.id);
  if (!access) return NextResponse.json({ error: "Hittades inte" }, { status: 404 });

  if (access.memberIds.length === 0) {
    return NextResponse.json({ passes: [], summary: { count: 0, totalAmount: 0, totalVat: 0 } });
  }

  const passes = await db
    .select({
      id: transportPasses.id,
      passType: transportPasses.passType,
      provider: transportPasses.provider,
      providerOther: transportPasses.providerOther,
      amount: transportPasses.amount,
      vatRate: transportPasses.vatRate,
      vatAmount: transportPasses.vatAmount,
      validFrom: transportPasses.validFrom,
      validTo: transportPasses.validTo,
    })
    .from(transportPasses)
    .where(inArray(transportPasses.userId, access.memberIds))
    .orderBy(transportPasses.validFrom);

  const round = (n: number) => Math.round(n * 100) / 100;
  type Pass = (typeof passes)[number];
  const summary = {
    count: passes.length,
    totalAmount: round(passes.reduce((s: number, p: Pass) => s + (Number(p.amount) || 0), 0)),
    totalVat: round(passes.reduce((s: number, p: Pass) => s + (Number(p.vatAmount) || 0), 0)),
  };

  void logAuditEvent({
    userId: acct.userId,
    action: "accountant.transport.list",
    entityType: "company",
    entityId: access.companyId,
    targetCompanyId: access.companyId,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ passes, summary });
}
