import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accountantClients, workerAssignments } from "@/db/schema";
import { requireFirmRole } from "@/lib/accountant";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * POST — remove a customer the firm works with. OWNER ONLY (per the rule that
 * only the main account can end a customer relationship — an admin cannot).
 *
 * Scoped to the caller's own firm: the relationship must be for the caller's
 * firmId, so an owner can never remove another firm's customer. Sets the
 * relationship to 'revoked' (history preserved) and clears all worker
 * assignments for that customer in the firm, so every worker loses access at
 * once — consistent with requireCompanyAccess.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { companyId: string } },
) {
  // Owner only — admins are explicitly not allowed to remove a customer.
  const m = await requireFirmRole("owner");
  if (!m) {
    return NextResponse.json(
      { error: "Endast ägaren kan ta bort en kund." },
      { status: 403 },
    );
  }

  const [rel] = await db
    .select({ id: accountantClients.id, status: accountantClients.status })
    .from(accountantClients)
    .where(
      and(
        eq(accountantClients.firmId, m.firmId),
        eq(accountantClients.companyId, params.companyId),
      ),
    )
    .limit(1);
  if (!rel || rel.status !== "active") {
    return NextResponse.json({ error: "Ingen aktiv kund att ta bort." }, { status: 404 });
  }

  await db
    .update(accountantClients)
    .set({ status: "revoked", revokedAt: new Date(), revokedBy: m.userId })
    .where(eq(accountantClients.id, rel.id));

  // Clear all worker assignments for this customer in the firm.
  await db
    .delete(workerAssignments)
    .where(
      and(
        eq(workerAssignments.firmId, m.firmId),
        eq(workerAssignments.companyId, params.companyId),
      ),
    );

  await logAudit({
    userId: m.userId,
    action: "firm.customer.remove",
    details: `firm ${m.firmId} removed customer ${params.companyId}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
