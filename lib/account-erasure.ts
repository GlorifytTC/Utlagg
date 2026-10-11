import { and, eq, inArray, isNull, ne, notInArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { companyMembers, integrationTokens, receipts, subscriptions, users } from "@/db/schema";
import { deleteAllUserImages } from "@/lib/storage";
import { stripe } from "@/lib/stripe";

/**
 * Cancel every Stripe subscription the user has, whatever its status (a trialing
 * or past_due account would otherwise be charged with no account left), then
 * drop the customer. Non-blocking: a Stripe error never prevents erasure.
 */
async function cancelStripe(userId: string): Promise<void> {
  const rows = await db
    .select({ sub: subscriptions.stripeSubscriptionId, customer: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));
  for (const r of rows) {
    if (r.sub) {
      try {
        await stripe.subscriptions.cancel(r.sub);
      } catch (e) {
        // Already canceled/missing is fine; anything else is logged, not fatal.
        console.error("stripe cancel on account delete failed (non-blocking):", e);
      }
    }
    if (r.customer) {
      await stripe.customers.del(r.customer).catch((e: unknown) =>
        console.error("stripe customer delete failed (non-blocking):", e),
      );
    }
  }
}

/**
 * Erase an account. Company receipts (Bokföringslagen, 7 years) must outlive a
 * member who leaves while the company still has other members, so in that case
 * the user row is kept as a de-identified tombstone: credentials and PII are
 * scrubbed, personal data is removed, company receipts + their R2 images stay.
 * Otherwise the row is deleted and the FK cascade does the rest.
 */
export async function eraseUser(userId: string): Promise<{ tombstoned: boolean }> {
  await cancelStripe(userId);

  // receipts.approved_by has no ON DELETE action: others' receipts this user
  // approved would block the delete.
  await db
    .update(receipts)
    .set({ approvedBy: null })
    .where(and(eq(receipts.approvedBy, userId), ne(receipts.userId, userId)));

  // Companies this user belongs to that have at least one other member.
  const mine = await db
    .select({ companyId: companyMembers.companyId })
    .from(companyMembers)
    .where(eq(companyMembers.userId, userId));
  const myIds = mine.map((m: { companyId: string }) => m.companyId);
  const keepCompanyIds = myIds.length
    ? [
        ...new Set<string>(
          (
            await db
              .select({ companyId: companyMembers.companyId })
              .from(companyMembers)
              .where(and(inArray(companyMembers.companyId, myIds), ne(companyMembers.userId, userId)))
          ).map((r: { companyId: string }) => r.companyId),
        ),
      ]
    : [];

  const retained = keepCompanyIds.length
    ? await db
        .select({ imageUrl: receipts.imageUrl })
        .from(receipts)
        .where(and(eq(receipts.userId, userId), inArray(receipts.companyId, keepCompanyIds)))
    : [];

  if (retained.length === 0) {
    await deleteAllUserImages(userId);
    await db.delete(users).where(eq(users.id, userId));
    return { tombstoned: false };
  }

  const keepKeys = new Set<string>(
    retained
      .map((r: { imageUrl: string | null }) => r.imageUrl)
      .filter((k: string | null): k is string => !!k),
  );
  await deleteAllUserImages(userId, keepKeys);
  await db
    .delete(receipts)
    .where(
      and(
        eq(receipts.userId, userId),
        or(isNull(receipts.companyId), notInArray(receipts.companyId, keepCompanyIds)),
      ),
    );
  await db.delete(subscriptions).where(eq(subscriptions.userId, userId));
  await db.delete(integrationTokens).where(eq(integrationTokens.userId, userId));
  // The companyMembers row stays: company/accountant views scope receipts by
  // member user ids, so removing it would hide the retained records.
  await db
    .update(users)
    .set({
      email: `deleted-${userId}@deleted.invalid`,
      emailNormalized: null,
      hashedPassword: null,
      bankIdSubject: null,
      name: null,
      companyName: null,
      signupIp: null,
      referralCode: null,
      inboundToken: null,
      emailVerificationToken: null,
      passwordResetToken: null,
      subscriptionTier: "free",
      subscriptionStatus: "canceled",
      subscriptionSource: null,
      sessionVersion: sql`${users.sessionVersion} + 1`,
    })
    .where(eq(users.id, userId));
  return { tombstoned: true };
}
