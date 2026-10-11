/**
 * A `trialing` Stripe event for an account that is already a paying customer is
 * not a new trial: it is a billing-date push (referral reward, lib/referrals.ts
 * sets `trial_end` on the live subscription). A real trial has a future
 * `trialEndsAt` (set on first entry); an in-trial plan switch keeps it.
 */
export function isTrialExtensionPush(
  user:
    | { subscriptionStatus: string | null; subscriptionSource: string | null; trialEndsAt: Date | null }
    | null
    | undefined,
  now: Date = new Date(),
): boolean {
  // A fresh trial starts from a free account (source null), never a Stripe-paid one.
  if (!user || user.subscriptionSource !== "stripe") return false;
  if (user.subscriptionStatus !== "active" && user.subscriptionStatus !== "past_due") return false;
  return !user.trialEndsAt || user.trialEndsAt.getTime() <= now.getTime();
}
