import "server-only";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hasFeature, type Feature } from "@/lib/features";
import type { Tier } from "@/lib/plans";

/** Resolve the signed-in user's EFFECTIVE tier (honours pause + trial expiry). */
export async function currentTier(): Promise<{ userId: string; tier: Tier } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const [u] = await db
    .select({
      tier: users.subscriptionTier,
      paused: users.subscriptionPaused,
      grantedUntil: users.subscriptionGrantedUntil,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  let tier = (u?.tier ?? "free") as Tier;
  // A paused subscription or an expired manual grant falls back to free.
  if (u?.paused) tier = "free";
  if (u?.grantedUntil && new Date(u.grantedUntil).getTime() < Date.now()) tier = "free";

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
