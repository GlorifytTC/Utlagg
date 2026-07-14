import "server-only";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hasFeature, type Feature } from "@/lib/features";
import { planForTier, type Tier } from "@/lib/plans";

/**
 * Resolve the signed-in user's EFFECTIVE tier (honours pause + trial expiry).
 *
 * When a manual/admin grant has EXPIRED we don't just compute "free" in
 * memory — we write the downgrade back to the database. Previously the DB
 * kept saying e.g. "business" forever while the gates treated the account as
 * free, so the subscription page proudly showed "You're on the Business plan"
 * next to a locked, upgrade-walled Mileage page. Persisting the transition
 * means every screen (user dashboard AND admin) sees the same truth: the plan
 * is gone.
 */
export async function currentTier(): Promise<{ userId: string; tier: Tier } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const [u] = await db
    .select({
      tier: users.subscriptionTier,
      paused: users.subscriptionPaused,
      grantedUntil: users.subscriptionGrantedUntil,
      source: users.subscriptionSource,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  let tier = (u?.tier ?? "free") as Tier;

  const grantExpired =
    !!u?.grantedUntil && new Date(u.grantedUntil).getTime() < Date.now();

  // An expired grant is a real state change: persist it so the plan actually
  // ends rather than lingering as a stale "business" row in the database.
  if (grantExpired && tier !== "free") {
    tier = "free";
    try {
      await db
        .update(users)
        .set({
          subscriptionTier: "free",
          subscriptionStatus: "canceled",
          subscriptionSource: null,
          subscriptionGrantedUntil: null,
          scanLimit: planForTier("free").scanLimit,
        })
        .where(eq(users.id, session.user.id));
    } catch (e) {
      // Never break the request over this — the in-memory downgrade below
      // still applies, so access is correctly denied either way.
      console.error("failed to persist expired-grant downgrade:", e);
    }
  } else if (grantExpired) {
    tier = "free";
  }

  // A paused subscription falls back to free (but keeps the tier so it can
  // be resumed later — pause is reversible, expiry is not).
  if (u?.paused) tier = "free";

  return { userId: session.user.id, tier };
}

export interface Gate {
  ok: boolean;
  status: 401 | 403 | 200;
  userId?: string;
  tier?: Tier;
}

/**
 * Server-side feature gate for API routes. Returns ok=false with 401 (not
 * signed in) or 403 (insufficient tier). This is the real enforcement — UI
 * hiding is cosmetic.
 */
export async function requireFeature(feature: Feature): Promise<Gate> {
  const ctx = await currentTier();
  if (!ctx) return { ok: false, status: 401 };
  if (!hasFeature(ctx.tier, feature)) {
    return { ok: false, status: 403, userId: ctx.userId, tier: ctx.tier };
  }
  return { ok: true, status: 200, userId: ctx.userId, tier: ctx.tier };
}
