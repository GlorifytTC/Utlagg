import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, subscriptions, type Subscription } from "@/db/schema";
import { getUserCompany } from "@/lib/company";
import type { Tier } from "@/lib/plans";
import { pricingV3Enabled } from "@/lib/billing/config";
import { resolveAccountState, type AccessState } from "@/lib/billing/access";

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
  /** Effective entitlement tier (trial → pro; pause/expired grant → free). */
  tier: Tier;
  /** Pricing V3 access state: active | trial | read_only (spec §A/§C). */
  state: AccessState;
  /** Grandfathered "unlimited scans" Pro (spec §2.5) — never capped. */
  legacyUnlimited: boolean;
  subscription: Subscription | null;
}

export async function resolveBillingContext(
  userId: string,
): Promise<BillingContext | null> {
  const [u] = await db
    .select({
      tier: users.subscriptionTier,
      status: users.subscriptionStatus,
      paused: users.subscriptionPaused,
      grantedUntil: users.subscriptionGrantedUntil,
      trialEndsAt: users.trialEndsAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return null;

  const { state, entitledTier } = resolveAccountState({
    subscriptionTier: u.tier as Tier,
    subscriptionStatus: u.status,
    subscriptionPaused: u.paused,
    subscriptionGrantedUntil: u.grantedUntil,
    trialEndsAt: u.trialEndsAt,
    v3Enabled: pricingV3Enabled(),
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
    tier: entitledTier,
    state,
    legacyUnlimited: sub?.legacyUnlimitedScans ?? false,
    subscription: sub ?? null,
  };
}
