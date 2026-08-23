-- ============================================================================
-- PRICING V3 — ALL DATABASE CHANGES (manual pgAdmin4 runbook)
-- ============================================================================
-- Single authoritative script for the Pricing V3 rework (Trial + Starter +
-- read-only export gating + repeat-trial email guard). Apply the sections in
-- order. This consolidates drizzle/0009_pricing_v3_trial_starter.sql (schema)
-- and scripts/backfill-pricing-v3.sql (data) into one place.
--
-- HOW TO RUN IN pgAdmin4
--   1. Connect to the PRODUCTION database (use the DIRECT connection, not the
--      pooled one, for DDL).
--   2. Run SECTION 1 (schema). See the enum caveat immediately below.
--   3. Run SECTION 2 (verification) and read the counts.
--   4. Only after the Free-tier withdrawal notices have been sent (product/legal
--      sign-off — required BEFORE withdrawing the plan), run SECTION 3 dry-run,
--      then SECTION 3 apply, then SECTION 4 post-checks.
--   5. Enable the app flags (PRICING_V3_ENABLED, then the sub-flags).
--
-- ⚠️ POSTGRES ENUM CAVEAT (read before Section 1)
--   * `ALTER TYPE ... ADD VALUE` must be COMMITTED before the new value can be
--     used by other statements. In the pgAdmin4 Query Tool, DO NOT wrap the
--     whole script in one transaction. Either:
--       (a) run SECTION 1a (the two ADD VALUE lines) on their own and let
--           pgAdmin auto-commit, THEN run SECTION 1b; or
--       (b) keep "auto-commit" ON (the pgAdmin default) and run 1a then 1b.
--   * Enum values CANNOT be removed. `free` is intentionally kept as a
--     DEPRECATED TOMBSTONE (removed from selectable plans in code, not dropped).
--   * Everything is idempotent (IF NOT EXISTS / guards) — safe to re-run.
--
-- MONEY is in öre. TIMES are timestamptz. Timezone for business math is
-- Europe/Stockholm (handled in app code, not here).
-- ============================================================================


-- ============================================================================
-- SECTION 1a — NEW ENUM VALUES  (run first, must be committed before 1b)
-- ============================================================================

-- New tier value: Starter (ordered before pro).
ALTER TYPE "subscription_tier" ADD VALUE IF NOT EXISTS 'starter' BEFORE 'pro';

-- New subscription status: read_only (lapse / expired-trial — spec §C).
ALTER TYPE "subscription_status" ADD VALUE IF NOT EXISTS 'read_only';


-- ============================================================================
-- SECTION 1b — NEW COLUMNS + TABLE  (run after 1a is committed)
-- ============================================================================

-- users: one-time Trial columns (spec §A, all nullable) --------------------
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trial_started_at"   timestamp with time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trial_ends_at"      timestamp with time zone;
-- Durable one-time-trial guard: set once, never cleared (spec §A.2 / §E.3).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trial_consumed_at"  timestamp with time zone;
-- Plan a card-required trial converts to at day 31 (spec §A.3). Uses the tier
-- enum; 'starter' from 1a must already be committed for this type reference.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "post_trial_plan"    "subscription_tier";

-- users: §D migration audit (all nullable) ---------------------------------
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "migration_notice_sent_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "migration_path"           varchar(20);

-- trial_email_guard (spec §E) ----------------------------------------------
-- Pseudonymised repeat-trial guard. Holds ONLY an HMAC-SHA256 of the normalised
-- email (hex) plus timestamps — NO plaintext email, no other identifying column.
CREATE TABLE IF NOT EXISTS "trial_email_guard" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email_hash" varchar(64) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  CONSTRAINT "trial_email_guard_email_hash_unique" UNIQUE ("email_hash")
);
CREATE INDEX IF NOT EXISTS "trial_email_guard_expiry_idx"
  ON "trial_email_guard" ("expires_at");


-- ============================================================================
-- SECTION 2 — SCHEMA VERIFICATION (optional; expect the new values/columns)
-- ============================================================================

-- 2a. Enum values present?
SELECT enumlabel FROM pg_enum
 WHERE enumtypid = 'subscription_tier'::regtype ORDER BY enumsortorder;
--  expect: free, starter, pro, business, max, enterprise
SELECT enumlabel FROM pg_enum
 WHERE enumtypid = 'subscription_status'::regtype ORDER BY enumsortorder;
--  expect: active, canceled, past_due, trialing, incomplete, read_only

-- 2b. New user columns present?
SELECT column_name FROM information_schema.columns
 WHERE table_name = 'users'
   AND column_name IN ('trial_started_at','trial_ends_at','trial_consumed_at',
                       'post_trial_plan','migration_notice_sent_at','migration_path')
 ORDER BY column_name;

-- 2c. Guard table present?
SELECT to_regclass('public.trial_email_guard') AS trial_email_guard_table;


-- ============================================================================
-- SECTION 3 — DATA BACK-FILL (spec §6)
-- ============================================================================
-- Idempotent: every UPDATE is guarded by `migration_path IS NULL`, so re-running
-- is a no-op. "Active" = any activity in the last 60 days (a receipt, an audit
-- row, or a recent signup) — the best proxy; there is no last-login column.
--
-- ⚠️ EMAILS ARE NOT SENT FROM SQL. The plan-change / trial-start notices (§6,
-- §10) and the `migration_notice_sent_at` stamp are sent by the app script
-- `npm run backfill:v3` (which does the same DB writes AND emails). If you run
-- THIS SQL for the DB writes, `migration_notice_sent_at` stays NULL so the app
-- mailer can still pick each row up later. Either apply this SQL OR run the app
-- script — not both blindly (both are idempotent, but pick one owner of email).
--
-- ⚠️ Do not run the UPDATEs in 3b until the Free-tier withdrawal notice period
-- has been honoured (advance notice is required — spec §13.3).

-- ---------------------------------------------------------------------------
-- 3a. DRY-RUN — counts only. Run these and record the numbers first.
-- ---------------------------------------------------------------------------

-- Free users to migrate, split active vs dormant.
SELECT
  CASE WHEN act.last_activity >= now() - interval '60 days' THEN 'active_trial'
       ELSE 'dormant_read_only' END AS bucket,
  count(*) AS n
FROM "users" u
CROSS JOIN LATERAL (
  SELECT GREATEST(
    u.created_at,
    COALESCE((SELECT max(r.created_at) FROM "receipts"  r WHERE r.user_id = u.id), 'epoch'::timestamptz),
    COALESCE((SELECT max(a.created_at) FROM "audit_logs" a WHERE a.user_id = u.id), 'epoch'::timestamptz)
  ) AS last_activity
) act
WHERE u.subscription_tier = 'free'
  AND u.trial_consumed_at IS NULL
  AND u.migration_path IS NULL
GROUP BY 1;

-- Paid subscribers that must be left UNCHANGED (only tagged for audit).
SELECT u.subscription_tier, count(*) AS n
FROM "users" u
WHERE u.subscription_tier IN ('starter','pro','business','max','enterprise')
  AND u.migration_path IS NULL
GROUP BY 1 ORDER BY 1;

-- Sanity: grandfathered-unlimited Pro must not be touched by anything here.
SELECT count(*) AS legacy_unlimited_pro
FROM "subscriptions" s
WHERE s.legacy_unlimited_scans = true;

-- ---------------------------------------------------------------------------
-- 3b. BACK-FILL — run only after the dry-run counts look right.
-- ---------------------------------------------------------------------------

-- 3b-i. ACTIVE Free → one-time 30-day (no-card) Trial with full Pro entitlement.
--       No card on file → expires to read-only (§C), never to reusable free
--       scans. trial_consumed_at is set so it can't recur.
UPDATE "users" u SET
  subscription_tier   = 'pro',        -- full Pro entitlement during the trial
  subscription_status = 'trialing',
  trial_started_at    = now(),
  trial_ends_at       = now() + (interval '1 day' * 30),  -- TRIAL_DAYS
  trial_consumed_at   = now(),
  post_trial_plan     = 'pro',        -- POST_TRIAL_DEFAULT_PLAN
  scan_limit          = 500,          -- TRIAL_SCANS (legacy counter safety)
  migration_path      = 'trial',
  updated_at          = now()
WHERE u.subscription_tier = 'free'
  AND u.trial_consumed_at IS NULL
  AND u.migration_path IS NULL
  AND GREATEST(
        u.created_at,
        COALESCE((SELECT max(r.created_at) FROM "receipts"  r WHERE r.user_id = u.id), 'epoch'::timestamptz),
        COALESCE((SELECT max(a.created_at) FROM "audit_logs" a WHERE a.user_id = u.id), 'epoch'::timestamptz)
      ) >= now() - interval '60 days';

-- 3b-ii. DORMANT Free → read-only under the 12-month export ladder (§7). Data is
--        NEVER deleted here. trial_consumed_at left NULL (they never used one).
UPDATE "users" u SET
  subscription_status = 'read_only',
  migration_path      = 'read_only',
  updated_at          = now()
WHERE u.subscription_tier = 'free'
  AND u.trial_consumed_at IS NULL
  AND u.migration_path IS NULL
  AND GREATEST(
        u.created_at,
        COALESCE((SELECT max(r.created_at) FROM "receipts"  r WHERE r.user_id = u.id), 'epoch'::timestamptz),
        COALESCE((SELECT max(a.created_at) FROM "audit_logs" a WHERE a.user_id = u.id), 'epoch'::timestamptz)
      ) < now() - interval '60 days';

-- 3b-iii. PAID subscribers (incl. legacy_unlimited_scans) → NO change to price,
--         cap, tier or entitlement. Only tag the path so re-runs skip them.
UPDATE "users" u SET
  migration_path = 'paid_unchanged'
WHERE u.subscription_tier IN ('starter','pro','business','max','enterprise')
  AND u.migration_path IS NULL;


-- ============================================================================
-- SECTION 4 — POST-CHECK (affected counts by path; compare to the 3a dry-run)
-- ============================================================================
SELECT migration_path, count(*) AS n
FROM "users"
WHERE migration_path IS NOT NULL
GROUP BY 1 ORDER BY 1;


-- ============================================================================
-- SECTION 5 — ROLLBACK (what CAN be reversed)
-- ============================================================================
-- Column/table additions are reversible. Enum value additions are NOT — disable
-- them in code (PRICING_V3_ENABLED=false) rather than dropping the enum. To undo
-- the reversible schema portion:
--
--   DROP TABLE IF EXISTS "trial_email_guard";
--   ALTER TABLE "users" DROP COLUMN IF EXISTS "migration_path";
--   ALTER TABLE "users" DROP COLUMN IF EXISTS "migration_notice_sent_at";
--   ALTER TABLE "users" DROP COLUMN IF EXISTS "post_trial_plan";
--   ALTER TABLE "users" DROP COLUMN IF EXISTS "trial_consumed_at";
--   ALTER TABLE "users" DROP COLUMN IF EXISTS "trial_ends_at";
--   ALTER TABLE "users" DROP COLUMN IF EXISTS "trial_started_at";
--
-- To undo the DATA back-fill (revert migrated Free users; leaves paid untouched):
--
--   UPDATE "users" SET subscription_tier='free', subscription_status='active',
--     trial_started_at=NULL, trial_ends_at=NULL, trial_consumed_at=NULL,
--     post_trial_plan=NULL, scan_limit=25, migration_path=NULL,
--     migration_notice_sent_at=NULL
--   WHERE migration_path = 'trial';
--   UPDATE "users" SET subscription_status='active', migration_path=NULL,
--     migration_notice_sent_at=NULL
--   WHERE migration_path = 'read_only';
--   UPDATE "users" SET migration_path=NULL WHERE migration_path = 'paid_unchanged';
-- ============================================================================
