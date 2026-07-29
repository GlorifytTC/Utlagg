import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { logAudit, clientIp } from "@/lib/audit";
import { deleteAllUserImages } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Deletes the account. FK cascades remove the user's receipts, expenses,
 * subscriptions and integration tokens. audit_logs.userId is ON DELETE SET NULL,
 * so the 7-year audit trail (Bokföringslagen) survives de-identified rather than
 * being destroyed — this is the safer reading of the GDPR-vs-retention tension.
 * (A production flow should also cancel any active Stripe subscription first.)
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  await logAudit({
    userId: session.user.id,
    action: "user.delete",
    ipAddress: clientIp(req),
  });
  // Cascade clears the DB rows; purge the user's R2 receipt images too so no
  // financial PII is left orphaned in the bucket.
  await deleteAllUserImages(session.user.id);
  await db.delete(users).where(eq(users.id, session.user.id));
  return NextResponse.json({ ok: true });
}
