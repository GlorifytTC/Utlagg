import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accountingFirms, firmMembers, workerAssignments } from "@/db/schema";
import { requireFirmRole } from "@/lib/accountant";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * POST — remove a person from the firm (owner/admin only). Guards:
 *   - the target must be in the CALLER's firm (never another firm)
 *   - the OWNER can never be removed (would orphan the firm)
 *   - an admin cannot remove the owner (enforced by the owner-guard above)
 * Removing a member also clears their worker assignments, so their access ends
 * immediately (their firm_members row is gone anyway → getUserFirm null).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const m = await requireFirmRole("admin");
  if (!m) return NextResponse.json({ error: "Endast ägare/admin." }, { status: 403 });

  // Never remove oneself.
  if (params.userId === m.userId) {
    return NextResponse.json({ error: "Du kan inte ta bort dig själv." }, { status: 403 });
  }

  // Target must be a member of the caller's own firm.
  const [target] = await db
    .select({ id: firmMembers.id, role: firmMembers.role })
    .from(firmMembers)
    .where(and(eq(firmMembers.firmId, m.firmId), eq(firmMembers.userId, params.userId)))
    .limit(1);
  if (!target) return NextResponse.json({ error: "Hittades inte" }, { status: 404 });

  // The owner can never be removed.
  const [firm] = await db
    .select({ ownerId: accountingFirms.ownerId })
    .from(accountingFirms)
    .where(eq(accountingFirms.id, m.firmId))
    .limit(1);
  if (firm?.ownerId === params.userId || target.role === "owner") {
    return NextResponse.json({ error: "Ägaren kan inte tas bort." }, { status: 403 });
  }

  // Clear their assignments first, then remove membership.
  await db
    .delete(workerAssignments)
    .where(and(eq(workerAssignments.firmId, m.firmId), eq(workerAssignments.workerId, params.userId)));
  await db
    .delete(firmMembers)
    .where(and(eq(firmMembers.firmId, m.firmId), eq(firmMembers.userId, params.userId)));

  await logAudit({
    userId: m.userId,
    action: "firm.member.remove",
    details: `firm ${m.firmId} removed user ${params.userId}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
