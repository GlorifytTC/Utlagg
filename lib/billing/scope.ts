import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, subscriptions, type Subscription } from "@/db/schema";
import { getUserCompany } from "@/lib/company";
import type { Tier } from "@/lib/plans";

/**
 * Which account a user's scans + credits are billed against.
 *
 * Spec §7.3 default: Business/Max scans are POOLED per organisation. We model
 * that simply — if the acting user belongs to a company, usage and credits are
 * scoped to that company (shared across the team); otherwise they are scoped to
 * the user. The plan/quota itself is read from the acting user's effective tier
 * (the app tracks tier per user today), so a solo user and a team member are
 * metered against the right pool without a separate org-subscription model.
 */
export interface BillingContext {
  scope: "user" | "company";
  scopeId: string;
  userId: string;
  tier: Tier;
  /** Grandfathered "unlimited scans" Pro (spec §2.5) — never capped. */
  legacyUnlimited: boolean;
  subscription: Subscription | null;
}

/** Effective tier honouring pause + expired manual grants (no session needed). */
function effectiveTier(u: {
  subscriptionTier: Tier;
  subscriptionPaused: boolean;
  subscriptionGrantedUntil: Date | null;
}): Tier {
  const grantExpired =
    !!u.subscriptionGrantedUntil &&
    new Date(u.subscriptionGrantedUntil).getTime() < Date.now();
  if (grantExpired) return "free";
  if (u.subscriptionPaused) return "free";
  return u.subscriptionTier;
}

export async function resolveBillingContext(
  userId: string,
): Promise<BillingContext | null> {
  const [u] = await db
    .select({
      tier: users.subscriptionTier,
      paused: users.subscriptionPaused,
      grantedUntil: users.subscriptionGrantedUntil,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return null;

  const tier = effectiveTier({
    subscriptionTier: u.tier as Tier,
    subscriptionPaused: u.paused,
    subscriptionGrantedUntil: u.grantedUntil,
  });

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  const company = await getUserCompany(userId);

  return {
    scope: company ? "company" : "user",
    scopeId: company ? company.companyId : userId,
    userId,
    tier,
    legacyUnlimited: sub?.legacyUnlimitedScans ?? false,
    subscription: sub ?? null,
  };
}
