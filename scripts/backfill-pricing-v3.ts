/**
 * Pricing V3 data back-fill (spec §6) — the CANONICAL, idempotent, re-runnable
 * version. Does the same DB writes as scripts/backfill-pricing-v3.sql AND sends
 * the plan-change / trial-start notice emails, stamping `migration_notice_sent_at`
 * and `migration_path` per account for audit/support.
 *
 * Idempotent: every account is keyed by `migration_path IS NULL`, so a second
 * run is a no-op. Safe to re-run after a partial run.
 *
 * Usage:
 *   npm run backfill:v3            # DRY-RUN: prints counts, writes nothing
 *   npm run backfill:v3 -- --apply # applies changes + sends notices
 *
 * ⚠️ ADVANCE NOTICE to Free users is required BEFORE withdrawing the plan
 * (product/legal sign-off — spec §13.3). Do not --apply until that has been
 * honoured. Paid subscribers (Pro/Business/Max/Starter/Enterprise, incl.
 * legacy_unlimited_scans) are NEVER re-priced — they're only tagged for audit.
 *
 * "Active" = any activity in the last 60 days (a receipt, an audit row, or a
 * recent signup) — the best available proxy; there is no last-login column.
 */
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  POST_TRIAL_DEFAULT_PLAN,
  TRIAL_DAYS,
  TRIAL_SCANS,
} from "@/lib/billing/config";
import { sendPlanChangeNotice } from "@/lib/email";
import { logAudit } from "@/lib/audit";

const APPLY = process.argv.includes("--apply");
const ACTIVE_WINDOW_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

type Candidate = {
  id: string;
  email: string;
  name: string | null;
  lastActivity: Date;
};

/** Free users not yet migrated, with a computed last-activity timestamp. */
async function loadFreeCandidates(): Promise<Candidate[]> {
  const rows = await db.execute(sql`
    SELECT u.id, u.email, u.name,
      GREATEST(
        u.created_at,
        COALESCE((SELECT max(r.created_at) FROM receipts r WHERE r.user_id = u.id), 'epoch'::timestamptz),
        COALESCE((SELECT max(a.created_at) FROM audit_logs a WHERE a.user_id = u.id), 'epoch'::timestamptz)
      ) AS last_activity
    FROM users u
    WHERE u.subscription_tier = 'free'
      AND u.trial_consumed_at IS NULL
      AND u.migration_path IS NULL
  `);
  return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    email: String(r.email),
    name: (r.name as string | null) ?? null,
    lastActivity: new Date(r.last_activity as string),
  }));
}

async function main() {
  const now = new Date();
  const activeCutoff = new Date(now.getTime() - ACTIVE_WINDOW_DAYS * DAY_MS);

  const free = await loadFreeCandidates();
  const active = free.filter((c) => c.lastActivity >= activeCutoff);
  const dormant = free.filter((c) => c.lastActivity < activeCutoff);

  // Paid accounts to tag (no re-pricing) — count only here.
  const [{ n: paidToTag }] = (await db.execute(sql`
    SELECT count(*)::int AS n FROM users
    WHERE subscription_tier IN ('starter','pro','business','max','enterprise')
      AND migration_path IS NULL
  `)) as unknown as Array<{ n: number }>;

  console.log(`Pricing V3 back-fill — ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`  active Free   → trial:     ${active.length}`);
  console.log(`  dormant Free  → read_only: ${dormant.length}`);
  console.log(`  paid accounts → tag only:  ${paidToTag}`);

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to write changes + send notices.");
    process.exit(0);
  }

  // 1. Active Free → one-time 30-day (no-card) Trial with full Pro entitlement.
  let trialed = 0;
  for (const c of active) {
    const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * DAY_MS);
    await db
      .update(users)
      .set({
        subscriptionTier: "pro",
        subscriptionStatus: "trialing",
        trialStartedAt: now,
        trialEndsAt,
        trialConsumedAt: sql`coalesce(${users.trialConsumedAt}, ${now})`,
        postTrialPlan: POST_TRIAL_DEFAULT_PLAN,
        scanLimit: TRIAL_SCANS,
        migrationPath: "trial",
        migrationNoticeSentAt: now,
        updatedAt: now,
      })
      .where(and(eq(users.id, c.id), isNull(users.migrationPath)));
    await sendPlanChangeNotice(c.email, {
      userName: c.name ?? "där",
      mode: "trial",
      actionUrl: `${APP_URL}/dashboard`,
    }).catch((e) => console.error(`notice email failed for ${c.id}:`, e));
    await logAudit({ userId: c.id, action: "migration.v3", details: "path=trial" });
    trialed++;
  }

  // 2. Dormant Free → read-only under the 12-month export ladder. Data retained.
  let readOnly = 0;
  for (const c of dormant) {
    await db
      .update(users)
      .set({
        subscriptionStatus: "read_only",
        migrationPath: "read_only",
        migrationNoticeSentAt: now,
        updatedAt: now,
      })
      .where(and(eq(users.id, c.id), isNull(users.migrationPath)));
    await sendPlanChangeNotice(c.email, {
      userName: c.name ?? "där",
      mode: "read_only",
      actionUrl: `${APP_URL}/dashboard`,
    }).catch((e) => console.error(`notice email failed for ${c.id}:`, e));
    await logAudit({ userId: c.id, action: "migration.v3", details: "path=read_only" });
    readOnly++;
  }

  // 3. Paid subscribers → tag for audit only. NO change to price/tier/entitlement.
  const tagged = await db
    .update(users)
    .set({ migrationPath: "paid_unchanged" })
    .where(
      and(
        isNull(users.migrationPath),
        sql`${users.subscriptionTier} IN ('starter','pro','business','max','enterprise')`,
      ),
    )
    .returning({ id: users.id });

  console.log("\nApplied:");
  console.log(`  trial:          ${trialed}`);
  console.log(`  read_only:      ${readOnly}`);
  console.log(`  paid_unchanged: ${tagged.length}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("back-fill failed:", err);
  process.exit(1);
});
