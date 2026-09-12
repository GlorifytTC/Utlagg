import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accountantClients } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany, canManageCompany } from "@/lib/company";
import { logAuditEvent, clientIp } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST — the CLIENT (company owner/admin) revokes an accountant's access.
 *
 * AUTHORIZATION (server-side, never trusts a browser companyId):
 *   authenticated user → resolve their CURRENT company from the DB → verify
 *   owner/admin (canManageCompany) → load the relationship for THAT company +
 *   the target accountant → require it to be ACTIVE → revoke.
 *
 * Because the company is resolved from the caller's own membership, a user of
 * Company A can never revoke an accountant's relationship with Company B by
 * supplying an accountant id — the WHERE is bound to the caller's own company.
 *
 * Revoke sets status=revoked, revokedAt=now, revokedBy=caller. Historical rows
 * are preserved (no delete). The accountant loses access immediately:
 * requireCompanyAccess only returns for status='active', so the next request
 * yields null. Only an ACTIVE relationship is affected — a pending request is
 * untouched (this endpoint never creates or mutates a pending row), and a
 * repeated revoke is a no-op that writes no second audit event.
 *
 * Relationships created via BOTH the invitation accept and the connection
 * request accept live in the same accountantClients table, so both are
 * revocable here — there is no parallel model.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { accountantId: string } },
) {
  const limited = await enforceRateLimit(req, "company-accountant-revoke");
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  // Company resolved from the caller's identity — never from input.
  const membership = await getUserCompany(session.user.id);
  if (!membership) return NextResponse.json({ error: "Inget företag." }, { status: 404 });
  if (!canManageCompany(membership.role)) {
    return NextResponse.json({ error: "Endast ägare/admin kan ta bort åtkomst." }, { status: 403 });
  }
  const companyId = membership.companyId;

  // Load the relationship for THIS company + target accountant.
  const [rel] = await db
    .select({
      id: accountantClients.id,
      status: accountantClients.status,
      activatedAt: accountantClients.activatedAt,
    })
    .from(accountantClients)
    .where(
      and(
        eq(accountantClients.companyId, companyId),
        eq(accountantClients.accountantId, params.accountantId),
      ),
    )
    .limit(1);

  // Only an ACTIVE relationship can be revoked. No active relationship (none,
  // pending, or already revoked) → 404, without disclosing which.
  if (!rel || rel.status !== "active") {
    return NextResponse.json({ error: "Ingen aktiv åtkomst att ta bort." }, { status: 404 });
  }

  const revokedAt = new Date();
  await db
    .update(accountantClients)
    .set({ status: "revoked", revokedAt, revokedBy: session.user.id })
    // Re-assert scope + active status in the WHERE so a concurrent change or a
    // mismatched company can never revoke the wrong row.
    .where(
      and(
        eq(accountantClients.id, rel.id),
        eq(accountantClients.companyId, companyId),
        eq(accountantClients.status, "active"),
      ),
    );

  await logAuditEvent({
    userId: session.user.id, // actor = the company owner/admin
    action: "accountant.access.revoke",
    entityType: "accountant_client",
    entityId: rel.id,
    oldValues: { status: "active", revokedAt: null, revokedBy: null },
    newValues: { status: "revoked", revokedAt: revokedAt.toISOString(), revokedBy: session.user.id },
    details: `company ${companyId} revoked accountant ${params.accountantId}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
