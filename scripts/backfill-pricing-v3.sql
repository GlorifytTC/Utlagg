-- Pricing V3 data back-fill (spec §6) — SEPARATE from the schema migration.
--
-- Idempotent & re-runnable: every UPDATE is guarded by `migration_path IS NULL`
-- so a second run is a no-op. Run the DRY-RUN counts FIRST and eyeball them
-- against production before running the UPDATEs. A human applies this in
-- pgAdmin4.
--
-- ⚠️ EMAILS ARE NOT SENT FROM SQL. The plan-change / trial-start notice email
-- (§6, §10) and the `migration_notice_sent_at` stamp are handled by the
-- canonical re-runnable script `scripts/backfill-pricing-v3.ts` (which does the
-- same DB writes AND sends the notices). Use THAT in production; this SQL file
-- is the equivalent pure-DB form for review / manual application, and leaves
-- `migration_notice_sent_at` NULL so the TS mailer can still pick each row up.
--
-- ADVANCE NOTICE to Free users is required BEFORE withdrawing the plan
-- (product/legal sign-off, spec §13.3). Do not run the UPDATEs until that
-- notice period has been honoured.
--
-- "Active" = any activity in the last 60 days: a receipt, an audit-log row, or
-- (for brand-new accounts) a recent signup. No last-login column exists, so this
-- is the best available proxy (spec §1.3).

-- ============================================================================
-- 0. Shared definition of "active free user" (a view-less CTE, inlined below).
--    lastActivity = GREATEST(created_at, latest receipt, latest audit row)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. DRY-RUN — counts only. Run these SELECTs and record the numbers.
-- ---------------------------------------------------------------------------

-- 1a. Free users to be migrated, split by active vs dormant.
SELECT
  CASE WHEN act.last_activity >= now() - interval '60 days' THEN 'active_trial'
       ELSE 'dormant_read_only' END AS bucket,
  count(*) AS n
FROM "users" u
CROSS JOIN LATERAL (
  SELECT GREATEST(
    u.created_at,
    COALESCE((SELECT max(r.created_at) FROM "receipts" r WHERE r.user_id = u.id), 'epoch'::timestamptz),
    COALESCE((SELECT max(a.created_at) FROM "audit_logs" a WHERE a.user_id = u.id), 'epoch'::timestamptz)
  ) AS last_activity
) act
WHERE u.subscription_tier = 'free'
  AND u.trial_consumed_at IS NULL
  AND u.migration_path IS NULL
GROUP BY 1;

-- 1b. Paid subscribers that must be left UNCHANGED (only tagged for audit).
SELECT u.subscription_tier, count(*) AS n
FROM "users" u
WHERE u.subscription_tier IN ('starter','pro','business','max','enterprise')
  AND u.migration_path IS NULL
GROUP BY 1
ORDER BY 1;

-- 1c. Sanity: grandfathered-unlimited Pro must not be touched by anything here.
SELECT count(*) AS legacy_unlimited_pro
FROM "subscriptions" s
WHERE s.legacy_unlimited_scans = true;

-- ---------------------------------------------------------------------------
-- 2. BACK-FILL — run only after the dry-run counts look right.
-- ---------------------------------------------------------------------------

-- 2a. ACTIVE Free → one-time 30-day Trial with full Pro entitlement.
--     No card on file → a no-card trial that expires to read-only (§C), never
--     back to reusable free scans. trial_consumed_at is set so it can't recur.
UPDATE "users" u SET
  subscription_tier   = 'pro',        -- full Pro entitlement during the trial
  subscription_status = 'trialing',
  trial_started_at    = now(),
  trial_ends_at       = now() + (interval '1 day' * 30),   -- TRIAL_DAYS
  trial_consumed_at   = now(),
  post_trial_plan     = 'pro',        -- POST_TRIAL_DEFAULT_PLAN
  scan_limit          = 500,          -- TRIAL_SCANS (legacy counter, flag-off safety)
  migration_path      = 'trial',
  updated_at          = now()
WHERE u.subscription_tier = 'free'
  AND u.trial_consumed_at IS NULL
  AND u.migration_path IS NULL
  AND GREATEST(
        u.created_at,
        COALESCE((SELECT max(r.created_at) FROM "receipts" r WHERE r.user_id = u.id), 'epoch'::timestamptz),
        COALESCE((SELECT max(a.created_at) FROM "audit_logs" a WHERE a.user_id = u.id), 'epoch'::timestamptz)
      ) >= now() - interval '60 days';

-- 2b. DORMANT Free → read-only under the 12-month export ladder (§7). No trial
--     they won't see. Data is NEVER deleted here — only the deletion ladder
--     (with its 90/30/7-day warnings) ever removes data. trial_consumed_at is
--     left NULL: they never consumed a trial.
UPDATE "users" u SET
  subscription_status = 'read_only',
  migration_path      = 'read_only',
  updated_at          = now()
WHERE u.subscription_tier = 'free'
  AND u.trial_consumed_at IS NULL
  AND u.migration_path IS NULL
  AND GREATEST(
        u.created_at,
        COALESCE((SELECT max(r.created_at) FROM "receipts" r WHERE r.user_id = u.id), 'epoch'::timestamptz),
        COALESCE((SELECT max(a.created_at) FROM "audit_logs" a WHERE a.user_id = u.id), 'epoch'::timestamptz)
      ) < now() - interval '60 days';

-- 2c. PAID subscribers (Pro/Business/Max/Starter/Enterprise, incl.
--     legacy_unlimited_scans) → NO change to price, cap, tier or entitlement.
--     Only tag the path for audit so re-runs skip them.
UPDATE "users" u SET
  migration_path = 'paid_unchanged'
WHERE u.subscription_tier IN ('starter','pro','business','max','enterprise')
  AND u.migration_path IS NULL;

-- ---------------------------------------------------------------------------
-- 3. POST-CHECK — affected row counts by path (should equal the dry-run split).
-- ---------------------------------------------------------------------------
SELECT migration_path, count(*) AS n
FROM "users"
WHERE migration_path IS NOT NULL
GROUP BY 1
ORDER BY 1;
