import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { logAudit, clientIp } from "@/lib/audit";
import { deleteAllUserImages } from "@/lib/storage";
import { recordTrialGuard } from "@/lib/billing/trial-guard";

export const runtime = "nodejs";

/**
 * Deletes the account. FK cascades remove the user's receipts, expenses,
 * subscriptions and integration tokens. audit_logs.userId is ON DELETE SET NULL,
 * so the 7-year audit trail (Bokföringslagen) survives de-identified rather than
 * being destroyed — this is the safer reading of the GDPR-vs-retention tension.
 * (A production flow should also cancel any active Stripe subscription first.)
 *
 * Pricing V3 §E: if the account CONSUMED a trial, we persist a pseudonymised
 * one-way token derived from its email BEFORE the wipe, so the same email can't
 * simply delete-and-restart the free trial. Erasure otherwise proceeds fully —
 * this token (an HMAC, non-reversible) is the only thing retained, disclosed in
 * the Privacy Policy (§F.5/§F.6).
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  // Read what we need for the trial-guard token BEFORE deleting the row.
  const [u] = await db
    .select({ email: users.email, trialConsumedAt: users.trialConsumedAt })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  await logAudit({
    userId: session.user.id,
    action: "user.delete",
    ipAddress: clientIp(req),
  });

  // Only retain a token for accounts that actually used their one trial (§E.2).
  if (u?.email && u.trialConsumedAt) {
    try {
      await recordTrialGuard(u.email);
    } catch (e) {
      // Never block erasure over the guard write — the deletion is the user's
      // right; the guard is a secondary anti-abuse layer.
      console.error("trial guard write failed (non-blocking):", e);
    }
  }

  // Cascade clears the DB rows; purge the user's R2 receipt images too so no
  // financial PII is left orphaned in the bucket.
  await deleteAllUserImages(session.user.id);
  await db.delete(users).where(eq(users.id, session.user.id));
  return NextResponse.json({ ok: true });
}
