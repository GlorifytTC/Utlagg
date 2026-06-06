import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { logAuditEvent, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // FK cascade clears receipts/expenses/subscriptions/tokens; audit_logs.userId
  // is SET NULL so the trail survives de-identified.
  await db.delete(users).where(eq(users.id, params.id));
  await logAuditEvent({
    userId: session.user!.id,
    action: "admin.user.delete",
    entityType: "user",
    entityId: params.id,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
