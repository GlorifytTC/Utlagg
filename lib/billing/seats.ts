import "server-only";
import { and, count, countDistinct, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users, companyMembers, companyInvites } from "@/db/schema";
import { getCompanyOwnerId } from "@/lib/company";
import { resolveAccountState } from "@/lib/billing/access";
import { pricingV2Enabled, pricingV3Enabled, seatLimit, UNLIMITED } from "@/lib/billing/config";
import type { Tier } from "@/lib/plans";

/**
 * Seat enforcement for the owner-pays model. Seats are INCLUDED in the owner's
 * tier (no paid extra seats); Enterprise gets a negotiated `users.custom_seats`.
 * Only enforced when Pricing V2 is on (limits are a V2 concept) so a flag-off
 * environment behaves exactly as before.
 */

/** Members + unexpired, unaccepted invites (each distinct email holds a seat). */
export async function seatsInUse(companyId: string): Promise<{ members: number; pending: number }> {
  const [m] = await db
    .select({ n: count() })
    .from(companyMembers)
    .where(eq(companyMembers.companyId, companyId));
  const [p] = await db
    .select({ n: countDistinct(companyInvites.email) })
    .from(companyInvites)
    .where(
      and(
        eq(companyInvites.companyId, companyId),
        isNull(companyInvites.acceptedAt),
        gt(companyInvites.expiresAt, new Date()),
      ),
    );
  return { members: m?.n ?? 0, pending: p?.n ?? 0 };
}

/**
 * Seat cap for a company: the owner's tier (post-trial plan while trialing, so a
 * Business trial can actually invite its team) or the Enterprise custom count.
 * `UNLIMITED` (-1) = no cap.
 */
export async function companySeatLimit(companyId: string): Promise<number> {
  const ownerId = await getCompanyOwnerId(companyId);
  if (!ownerId) return UNLIMITED;
  const [o] = await db
    .select({
      tier: users.subscriptionTier,
      status: users.subscriptionStatus,
      paused: users.subscriptionPaused,
      grantedUntil: users.subscriptionGrantedUntil,
      trialEndsAt: users.trialEndsAt,
      postTrialPlan: users.postTrialPlan,
      customSeats: users.customSeats,
    })
    .from(users)
    .where(eq(users.id, ownerId))
    .limit(1);
  if (!o) return UNLIMITED;
  const { state, entitledTier } = resolveAccountState({
    subscriptionTier: o.tier as Tier,
    subscriptionStatus: o.status,
    subscriptionPaused: o.paused,
    subscriptionGrantedUntil: o.grantedUntil,
    trialEndsAt: o.trialEndsAt,
    v3Enabled: pricingV3Enabled(),
  });
  const tier = state === "trial" ? ((o.postTrialPlan as Tier | null) ?? entitledTier) : entitledTier;
  return seatLimit(tier, o.customSeats);
}

/**
 * Can the company take one more person? `countPending` = true when creating an
 * invite (pending invites hold seats); false when ACCEPTING one (that invite is
 * the seat being claimed, so only real members count).
 */
export async function canAddSeat(
  companyId: string,
  countPending: boolean,
): Promise<{ ok: boolean; limit: number }> {
  if (!pricingV2Enabled()) return { ok: true, limit: UNLIMITED };
  const limit = await companySeatLimit(companyId);
  if (limit === UNLIMITED) return { ok: true, limit };
  const { members, pending } = await seatsInUse(companyId);
  return { ok: members + (countPending ? pending : 0) < limit, limit };
}

export const SEAT_LIMIT_MSG =
  "Er plan har inga lediga platser. Uppgradera planen för fler användare.";
