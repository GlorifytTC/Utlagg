import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountingFirms } from "@/db/schema";
import { requireFirmRole } from "@/lib/accountant";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * DELETE — owner dissolves the firm. FK cascades remove firmMembers,
 * firmInvites, workerAssignments, and accountantClients rows. Irreversible.
 * Only the firm owner may do this; admins and members are refused.
 */
export async function DELETE(req: NextRequest) {
  const m = await requireFirmRole("owner");
  if (!m) return NextResponse.json({ error: "Endast ägaren kan ta bort firman." }, { status: 403 });

  await logAudit({
    userId: m.userId,
    action: "firm.delete",
    details: `firm ${m.firmId}`,
    ipAddress: clientIp(req),
  });

  await db.delete(accountingFirms).where(eq(accountingFirms.id, m.firmId));
  return NextResponse.json({ ok: true });
}
