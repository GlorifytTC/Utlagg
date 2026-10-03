import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, subscriptions, type Subscription } from "@/db/schema";
import { getUserCompany, getCompanyOwnerId } from "@/lib/company";
import type { Tier } from "@/lib/plans";
import { pricingV3Enabled } from "@/lib/billing/config";
import { resolveAccountState, type AccessState } from "@/lib/billing/access";

/**
 * Which account a user's scans + credits are billed against.
 *
 * Spec §7.3 default: Business/Max scans are POOLED per organisation. We model
 * that simply - if the acting user belongs to a company, usage and credits are
 * scoped to that company (shared across the team); otherwise they are scoped to
 * the user.
 *
 * Owner-pays: the plan, state, subscription, billing period, overage rate and
 * spend cap all come from the company OWNER's account (the payer), never from the
 * acting member. So the pool size, period and cap are identical whoever scans,
 * members inherit the owner's entitlement (and its lapse), and subscriptions
 * never "stack". `userId` stays the acting user.
 */
export interface BillingContext {
  scope: "user" | "company";
  scopeId: string;
  userId: string;
  /** The account whose plan/subscription applies (company owner, else userId). */
  payerId: string;
  /** Effective entitlement tier (trial → pro; pause/expired grant → free). */
  tier: Tier;
  /** Pricing V3 access state: active | trial | read_only (spec §A/§C). */
  state: AccessState;
  /** Grandfathered "unlimited scans" Pro (spec §2.5) - never capped. */
  legacyUnlimited: boolean;
  subscription: Subscription | null;
}

export async function resolveBillingContext(
  userId: string,
): Promise<BillingContext | null> {
  const company = await getUserCompany(userId);
  const payerId = (company && (await getCompanyOwnerId(company.companyId))) || userId;

  const [u] = await db
    .select({
      tier: users.subscriptionTier,
      status: users.subscriptionStatus,
      paused: users.subscriptionPaused,
      grantedUntil: users.subscriptionGrantedUntil,
      trialEndsAt: users.trialEndsAt,
    })
    .from(users)
    .where(eq(users.id, payerId))
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
    .where(eq(subscriptions.userId, payerId))
    .limit(1);

  return {
    scope: company ? "company" : "user",
    scopeId: company ? company.companyId : userId,
    userId,
    payerId,
    tier: entitledTier,
    state,
    legacyUnlimited: sub?.legacyUnlimitedScans ?? false,
    subscription: sub ?? null,
  };
}
