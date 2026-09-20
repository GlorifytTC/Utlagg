import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, accountantConnectionRequests, accountantClients } from "@/db/schema";
import { requireAccountant, getUserFirm } from "@/lib/accountant";
import { logAuditEvent, clientIp } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST — the accountant ACCEPTS a pending connection request.
 *
 * AUTHORIZATION: requireAccountant() → load the request by id AND
 * accountantId (so it can only be this accountant's own request; another
 * accountant's id yields no row → 404). Only a pending request can be
 * accepted. On accept, the accountantClients relationship is created or
 * (if a prior revoked row exists) reactivated — mirroring the invitation
 * accept exactly, and respecting the unique (accountantId, companyId)
 * constraint. Idempotent: re-accepting an already-active pair is a no-op.
 *
 * After this returns, requireCompanyAccess(accountant, company) immediately
 * allows access via the now-active relationship.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const limited = await enforceRateLimit(req, "accountant-conn-req-accept");
  if (limited) return limited;

  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  // Scoped to this accountant — another accountant's request → 404.
  const [reqRow] = await db
    .select()
    .from(accountantConnectionRequests)
    .where(
      and(
        eq(accountantConnectionRequests.id, params.id),
        eq(accountantConnectionRequests.accountantId, acct.userId),
      ),
    )
    .limit(1);
  if (!reqRow) return NextResponse.json({ error: "Hittades inte" }, { status: 404 });

  if (reqRow.status !== "pending") {
    return NextResponse.json({ error: "Förfrågan är redan besvarad." }, { status: 409 });
  }

  // Company must still exist.
  const [company] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.id, reqRow.companyId))
    .limit(1);
  if (!company) return NextResponse.json({ error: "Företaget finns inte längre." }, { status: 404 });

  // Create or reactivate the relationship (mirror invitation accept).
  const [existingRel] = await db
    .select({ id: accountantClients.id, status: accountantClients.status })
    .from(accountantClients)
    .where(
      and(
        eq(accountantClients.accountantId, acct.userId),
        eq(accountantClients.companyId, reqRow.companyId),
      ),
    )
    .limit(1);

  if (existingRel) {
    if (existingRel.status !== "active") {
      await db
        .update(accountantClients)
        .set({ status: "active", activatedAt: new Date(), revokedAt: null, revokedBy: null })
        .where(eq(accountantClients.id, existingRel.id));
    }
  } else {
    const firm = await getUserFirm(acct.userId);
    await db.insert(accountantClients).values({
      accountantId: acct.userId,
      firmId: firm?.firmId ?? null,
      companyId: reqRow.companyId,
      status: "active",
      activatedAt: new Date(),
    });
  }

  await db
    .update(accountantConnectionRequests)
    .set({ status: "active", respondedAt: new Date() })
    .where(eq(accountantConnectionRequests.id, reqRow.id));

  await logAuditEvent({
    userId: acct.userId,
    action: "accountant.connection_request.accept",
    entityType: "accountant_connection_request",
    entityId: reqRow.id,
    details: `company ${reqRow.companyId}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true, companyId: reqRow.companyId });
}
