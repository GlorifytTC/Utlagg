import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { users, subscriptions, accountingFirms, firmMembers, companyMembers } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { logAudit, clientIp } from "@/lib/audit";
import { deleteAllUserImages } from "@/lib/storage";
import { recordTrialGuard } from "@/lib/billing/trial-guard";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Deletes the account. FK cascades remove the user's receipts, expenses,
 * subscriptions and integration tokens. audit_logs.userId is ON DELETE SET NULL,
 * so the 7-year audit trail (Bokföringslagen) survives de-identified rather than
 * being destroyed — this is the safer reading of the GDPR-vs-retention tension.
 *
 * Pre-deletion steps (in order):
 *   1. Firm owner guard: block if other members exist (delete the firm or
 *      transfer ownership first via firm settings). Auto-delete if sole member —
 *      avoids an orphaned accountingFirms row with ownerId SET NULL and no
 *      recoverable owner role left in firmMembers.
 *   2. Company owner: auto-promote the oldest admin to owner so the company
 *      stays manageable. No admin → company survives without an owner, which is
 *      acceptable when the owner was the only member.
 *   3. Cancel active Stripe subscription immediately so billing stops. Non-
 *      blocking — a Stripe error never prevents erasure (erasure is the user's
 *      right under GDPR).
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
  const userId = session.user.id;

  // Read what we need for the trial-guard token BEFORE deleting the row.
  const [u] = await db
    .select({ email: users.email, trialConsumedAt: users.trialConsumedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Firm owner guard: accountingFirms.ownerId goes SET NULL on user delete,
  // leaving the firm alive with no recoverable owner role in firmMembers.
  const [ownedFirm] = await db
    .select({ id: accountingFirms.id })
    .from(accountingFirms)
    .where(eq(accountingFirms.ownerId, userId))
    .limit(1);

  if (ownedFirm) {
    const [{ otherMembers }] = await db
      .select({ otherMembers: count() })
      .from(firmMembers)
      .where(and(eq(firmMembers.firmId, ownedFirm.id), ne(firmMembers.userId, userId)));

    if (otherMembers > 0) {
      return NextResponse.json(
        { error: "Ta bort firman eller överför ägarskapet innan du raderar kontot." },
        { status: 409 },
      );
    }
    // Sole member — delete the firm; FK cascades clean up firmMembers/accountantClients/workerAssignments.
    await db.delete(accountingFirms).where(eq(accountingFirms.id, ownedFirm.id));
  }

  // Company owner: promote the oldest admin so the company stays manageable.
  const [ownedMembership] = await db
    .select({ companyId: companyMembers.companyId })
    .from(companyMembers)
    .where(and(eq(companyMembers.userId, userId), eq(companyMembers.role, "owner")))
    .limit(1);

  if (ownedMembership) {
    const [nextOwner] = await db
      .select({ id: companyMembers.id })
      .from(companyMembers)
      .where(
        and(
          eq(companyMembers.companyId, ownedMembership.companyId),
          eq(companyMembers.role, "admin"),
          ne(companyMembers.userId, userId),
        ),
      )
      .orderBy(companyMembers.createdAt)
      .limit(1);

    if (nextOwner) {
      await db.update(companyMembers).set({ role: "owner" }).where(eq(companyMembers.id, nextOwner.id));
    }
  }

  // Cancel active Stripe subscription before the cascade wipes stripeSubscriptionId.
  const [sub] = await db
    .select({ stripeSubscriptionId: subscriptions.stripeSubscriptionId })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
    .limit(1);

  if (sub?.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
    } catch (e) {
      console.error("stripe cancel on account delete failed (non-blocking):", e);
    }
  }

  await logAudit({
    userId,
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
  await deleteAllUserImages(userId);
  await db.delete(users).where(eq(users.id, userId));
  return NextResponse.json({ ok: true });
}
