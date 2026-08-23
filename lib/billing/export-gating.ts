import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  exportGatingEnabled,
  pricingV3Enabled,
  type ExportFormat,
} from "@/lib/billing/config";
import { resolveAccountState, type AccessState } from "@/lib/billing/access";
import type { Tier } from "@/lib/plans";
import {
  canUseExport,
  type ExportDecision,
} from "@/lib/billing/export-gating-core";

/**
 * The SINGLE export entitlement helper (spec §C.1). Every export entry point
 * calls {@link assertExportAllowed} — there are NO inline format checks anywhere
 * else, so the legal guardrail can't drift. The pure decision lives in
 * lib/billing/export-gating-core.ts (unit-tested); this module adds the state
 * lookup and the flag gate.
 */
export { canUseExport };
export type { ExportDecision };

/** Resolve a user's current access state for export gating (light query). */
export async function exportAccessState(userId: string): Promise<AccessState> {
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
  if (!u) return "active";
  return resolveAccountState({
    subscriptionTier: u.tier as Tier,
    subscriptionStatus: u.status,
    subscriptionPaused: u.paused,
    subscriptionGrantedUntil: u.grantedUntil,
    trialEndsAt: u.trialEndsAt,
    v3Enabled: pricingV3Enabled(),
  }).state;
}

/**
 * Server-side gate for an export route. Resolves the user's state and applies
 * {@link canUseExport}. When export gating is disabled (flag off) it always
 * allows — the flag is the rollback switch, but the always-available invariant
 * still holds because those formats never reach the gated branch anyway.
 */
export async function assertExportAllowed(
  userId: string,
  format: ExportFormat,
): Promise<ExportDecision> {
  if (!exportGatingEnabled()) return { allowed: true, format, reason: "ok" };
  const state = await exportAccessState(userId);
  return canUseExport({ state }, format);
}
