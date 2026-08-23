import "server-only";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, scanUsage, scanCredits } from "@/db/schema";
import {
  DEFAULT_OVERAGE_CAP_ORE,
  TRIAL_SCANS,
  UNLIMITED,
  pricingV2Enabled,
  tierConfig,
} from "@/lib/billing/config";
import { resolveBillingPeriod } from "@/lib/billing/period";
import { resolveBillingContext, type BillingContext } from "@/lib/billing/scope";
import { decideScan, type ConsumeSource, type ScanReason } from "@/lib/billing/quota";
import { logAudit } from "@/lib/audit";

/**
 * Scan metering — THE single choke-point (spec §6). Every place that consumes a
 * scan calls {@link meterScan}; the cap check and usage accounting live here and
 * nowhere else. Today the app's one persistence point for a scanned receipt is
 * POST /api/receipts, so that's where this is wired in; if a server-side OCR
 * pre-count is ever added, it must call this same function rather than
 * re-implementing the check.
 *
 * When PRICING_V2_ENABLED is off we fall back to the legacy per-user counter so
 * existing environments are unchanged.
 */

export interface MeterOutcome {
  allowed: boolean;
  reason:
    | ScanReason
    | "legacy_limit"
    | "legacy_ok"
    | "no_user"
    | "trial_hard_stop"
    | "read_only";
  source: ConsumeSource | null;
  planScansUsed: number;
  planLimit: number; // -1 = unlimited
  creditsRemaining: number;
  overageScansThisPeriod: number;
  overageOreThisPeriod: number;
  spendCapOre: number;
  /** Localised message for hard-stops (free cap / spend cap). */
  message?: string;
}

const FREE_STOP_MSG =
  "Du har nått månadens gräns på gratisplanen. Uppgradera för fler skanningar.";
const CAP_STOP_MSG =
  "Din månatliga kostnadsgräns för extra skanningar är nådd. Höj gränsen eller uppgradera för att fortsätta.";
// Trial hard-stop (spec §3.1: no overage, hard-stop at TRIAL_SCANS with a
// convert prompt).
const TRIAL_STOP_MSG =
  "Du har använt alla skanningar i din provperiod. Uppgradera till en betald plan för att fortsätta.";
// Read-only lockout (spec §C): scanning/uploading is blocked, but a complete CSV
// export and your original files remain available.
const READ_ONLY_MSG =
  "Ditt konto är i läsläge. Du kan fortfarande exportera dina kvitton (CSV) och ladda ner dina originalfiler. Aktivera en prenumeration för att skanna igen.";

/** Sum of unexpired, non-empty purchased credits for a billing account. */
async function creditsRemaining(scope: "user" | "company", scopeId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${scanCredits.scansRemaining}), 0)::int` })
    .from(scanCredits)
    .where(
      and(
        eq(scanCredits.scope, scope),
        eq(scanCredits.scopeId, scopeId),
        gt(scanCredits.scansRemaining, 0),
        gt(scanCredits.expiresAt, new Date()),
      ),
    );
  return row?.total ?? 0;
}

/** Get-or-create the usage row for a billing account's current period. */
async function usageRowFor(ctx: BillingContext) {
  const period = resolveBillingPeriod(ctx.subscription);
  // Idempotent upsert keyed by the unique (scope, scopeId, period_start) index.
  await db
    .insert(scanUsage)
    .values({
      scope: ctx.scope,
      scopeId: ctx.scopeId,
      periodStart: period.start,
      periodEnd: period.end,
    })
    .onConflictDoNothing();
  const [row] = await db
    .select()
    .from(scanUsage)
    .where(
      and(
        eq(scanUsage.scope, ctx.scope),
        eq(scanUsage.scopeId, ctx.scopeId),
        eq(scanUsage.periodStart, period.start),
      ),
    )
    .limit(1);
  return row;
}

/** Consume exactly one unexpired credit (oldest-expiring first). Atomic. */
async function consumeOneCredit(scope: "user" | "company", scopeId: string): Promise<boolean> {
  const res = await db.execute(sql`
    UPDATE scan_credits
       SET scans_remaining = scans_remaining - 1
     WHERE id = (
       SELECT id FROM scan_credits
        WHERE scope = ${scope} AND scope_id = ${scopeId}
          AND scans_remaining > 0 AND expires_at > now()
        ORDER BY expires_at ASC
        LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING id
  `);
  // drizzle-postgres-js db.execute() returns the driver RowList (array-like);
  // a non-empty result means we successfully claimed a credit.
  return (res as unknown as { length: number }).length > 0;
}

export async function meterScan(userId: string): Promise<MeterOutcome> {
  const ctx = await resolveBillingContext(userId);
  if (!ctx) {
    return {
      allowed: false,
      reason: "no_user",
      source: null,
      planScansUsed: 0,
      planLimit: 0,
      creditsRemaining: 0,
      overageScansThisPeriod: 0,
      overageOreThisPeriod: 0,
      spendCapOre: 0,
    };
  }

  // ---- Legacy path: flag off → keep the old flat per-user counter. ----------
  if (!pricingV2Enabled()) {
    return legacyMeter(userId);
  }

  // ---- V3 read-only lockout (spec §C): no new scans; exports stay open. ------
  if (ctx.state === "read_only") {
    return {
      allowed: false,
      reason: "read_only",
      source: null,
      planScansUsed: 0,
      planLimit: 0,
      creditsRemaining: 0,
      overageScansThisPeriod: 0,
      overageOreThisPeriod: 0,
      spendCapOre: 0,
      message: READ_ONLY_MSG,
    };
  }

  // Trial = full Pro entitlement (ctx.tier is already 'pro') but hard-stops at
  // TRIAL_SCANS with NO overage and no credits (spec §3.1). Everything else uses
  // the tier config.
  const isTrial = ctx.state === "trial";
  const cfg = tierConfig(ctx.tier);
  const unlimited =
    !isTrial &&
    (ctx.legacyUnlimited || cfg.monthlyScans === UNLIMITED || ctx.tier === "enterprise");
  const planLimit = isTrial ? TRIAL_SCANS : unlimited ? UNLIMITED : cfg.monthlyScans;
  const overageRateOre = isTrial ? null : cfg.overageOrePerScan;
  const spendCapOre = ctx.subscription?.overageSpendCapOre ?? DEFAULT_OVERAGE_CAP_ORE;

  const row = await usageRowFor(ctx);
  const credits =
    unlimited || isTrial ? 0 : await creditsRemaining(ctx.scope, ctx.scopeId);

  const decision = decideScan({
    unlimited,
    planScansUsed: row.planScansUsed,
    planLimit: unlimited ? Number.MAX_SAFE_INTEGER : planLimit,
    creditsRemaining: credits,
    overageRateOre,
    overageOreSoFar: row.overageBilledOre,
    spendCapOre,
  });

  const snapshot = (extra: Partial<MeterOutcome> = {}): MeterOutcome => ({
    allowed: decision.allowed,
    reason: decision.reason,
    source: decision.consume,
    planScansUsed: row.planScansUsed,
    planLimit,
    creditsRemaining: credits,
    overageScansThisPeriod: row.overageScansUsed,
    overageOreThisPeriod: row.overageBilledOre,
    spendCapOre,
    ...extra,
  });

  // ---- Apply the decision. --------------------------------------------------
  if (!decision.allowed) {
    if (decision.reason === "spend_cap_reached" && !row.capReached) {
      await db
        .update(scanUsage)
        .set({ capReached: true, updatedAt: new Date() })
        .where(eq(scanUsage.id, row.id));
      await logAudit({
        userId,
        action: "billing.overage_cap_reached",
        details: `scope=${ctx.scope}:${ctx.scopeId} cap=${spendCapOre}öre`,
      });
    }
    // A trial exhausting its quota hard-stops with a convert prompt, not the
    // free-plan upgrade copy.
    if (decision.reason === "free_hard_stop" && isTrial) {
      return snapshot({ reason: "trial_hard_stop", message: TRIAL_STOP_MSG });
    }
    return snapshot({
      message: decision.reason === "free_hard_stop" ? FREE_STOP_MSG : CAP_STOP_MSG,
    });
  }

  switch (decision.consume) {
    case "plan":
      await db
        .update(scanUsage)
        .set({ planScansUsed: sql`${scanUsage.planScansUsed} + 1`, updatedAt: new Date() })
        .where(eq(scanUsage.id, row.id));
      return snapshot({ planScansUsed: row.planScansUsed + 1 });

    case "credit": {
      const ok = await consumeOneCredit(ctx.scope, ctx.scopeId);
      if (!ok) {
        // Lost a race for the last credit — re-meter so we fall through to
        // overage / hard-stop correctly rather than granting a free scan.
        return meterScan(userId);
      }
      return snapshot({ creditsRemaining: Math.max(0, credits - 1) });
    }

    case "overage":
      await db
        .update(scanUsage)
        .set({
          overageScansUsed: sql`${scanUsage.overageScansUsed} + 1`,
          overageBilledOre: sql`${scanUsage.overageBilledOre} + ${decision.overageChargeOre}`,
          updatedAt: new Date(),
        })
        .where(eq(scanUsage.id, row.id));
      return snapshot({
        overageScansThisPeriod: row.overageScansUsed + 1,
        overageOreThisPeriod: row.overageBilledOre + decision.overageChargeOre,
      });

    default:
      return snapshot();
  }
}

/** Read-only usage snapshot for UI (dashboard, /api/me, subscription page). */
export async function getUsageSnapshot(userId: string): Promise<MeterOutcome | null> {
  const ctx = await resolveBillingContext(userId);
  if (!ctx) return null;
  if (!pricingV2Enabled()) return legacyMeter(userId, { peek: true });

  // Read-only: nothing to meter — scanning is locked (exports remain open).
  if (ctx.state === "read_only") {
    return {
      allowed: false,
      reason: "read_only",
      source: null,
      planScansUsed: 0,
      planLimit: 0,
      creditsRemaining: 0,
      overageScansThisPeriod: 0,
      overageOreThisPeriod: 0,
      spendCapOre: 0,
      message: READ_ONLY_MSG,
    };
  }

  const isTrial = ctx.state === "trial";
  const cfg = tierConfig(ctx.tier);
  const unlimited =
    !isTrial &&
    (ctx.legacyUnlimited || cfg.monthlyScans === UNLIMITED || ctx.tier === "enterprise");
  const row = await usageRowFor(ctx);
  const credits = isTrial ? 0 : await creditsRemaining(ctx.scope, ctx.scopeId);
  const spendCapOre = ctx.subscription?.overageSpendCapOre ?? DEFAULT_OVERAGE_CAP_ORE;
  return {
    allowed: true,
    reason: isTrial ? "plan" : unlimited ? "unlimited" : "plan",
    source: null,
    planScansUsed: row.planScansUsed,
    planLimit: isTrial ? TRIAL_SCANS : unlimited ? UNLIMITED : cfg.monthlyScans,
    creditsRemaining: credits,
    overageScansThisPeriod: row.overageScansUsed,
    overageOreThisPeriod: row.overageBilledOre,
    spendCapOre,
  };
}

/** Legacy counter (flag off): the pre-V2 flat per-user scanLimit behaviour. */
async function legacyMeter(
  userId: string,
  opts: { peek?: boolean } = {},
): Promise<MeterOutcome> {
  const [u] = await db
    .select({ used: users.scansUsedThisMonth, limit: users.scanLimit })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) {
    return {
      allowed: false, reason: "no_user", source: null, planScansUsed: 0, planLimit: 0,
      creditsRemaining: 0, overageScansThisPeriod: 0, overageOreThisPeriod: 0, spendCapOre: 0,
    };
  }
  const unlimited = u.limit === -1;
  const allowed = unlimited || u.used < u.limit;
  if (allowed && !opts.peek && !unlimited) {
    await db
      .update(users)
      .set({ scansUsedThisMonth: sql`${users.scansUsedThisMonth} + 1` })
      .where(eq(users.id, userId));
  }
  return {
    allowed,
    reason: allowed ? "legacy_ok" : "legacy_limit",
    source: allowed ? "plan" : null,
    planScansUsed: u.used + (allowed && !opts.peek && !unlimited ? 1 : 0),
    planLimit: u.limit,
    creditsRemaining: 0,
    overageScansThisPeriod: 0,
    overageOreThisPeriod: 0,
    spendCapOre: 0,
    message: allowed ? undefined : FREE_STOP_MSG,
  };
}
