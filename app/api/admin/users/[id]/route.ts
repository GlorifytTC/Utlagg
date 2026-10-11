import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { logAuditEvent, clientIp } from "@/lib/audit";
import { eraseUser } from "@/lib/account-erasure";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Cancels Stripe, purges images, deletes (or de-identifies, when company
  // receipts must be retained) - same path as self-service deletion.
  await eraseUser(params.id);
  await logAuditEvent({
    userId: session.user!.id,
    action: "admin.user.delete",
    entityType: "user",
    entityId: params.id,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
