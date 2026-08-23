-- Pricing V3 — Trial + Starter + read-only export gating + repeat-trial guard.
--
-- SCHEMA changes only. Data back-fill (§6) is a SEPARATE, idempotent step:
-- scripts/backfill-pricing-v3.sql (dry-run counts first). Never run the
-- back-fill inline with this migration.
--
-- Written idempotently (IF NOT EXISTS / guards) so it is safe to re-run and safe
-- on environments where earlier hand-applied migrations already ran. A human
-- reviewer applies this in pgAdmin4.
--
-- ⚠️ POSTGRES ENUM GOTCHAS (spec §7):
--   * `ALTER TYPE ... ADD VALUE` cannot run inside a transaction block together
--     with statements that USE the new value. Each ADD VALUE below is its own
--     statement; if your client wraps everything in one transaction, run the two
--     ADD VALUE lines on their own and COMMIT before the rest.
--   * Enum values CANNOT be removed. `free` therefore stays as a DEPRECATED
--     TOMBSTONE — it is removed from selectable-plans config + guarded in code
--     (lib/billing/config.ts `selectable:false`), not dropped here. Rolling back
--     the enum additions is a code-level change (stop referencing 'starter' /
--     'read_only'), not a schema DROP.

-- --- New tier value: Starter (kept before pro in the ordering) ---------------
ALTER TYPE "subscription_tier" ADD VALUE IF NOT EXISTS 'starter' BEFORE 'pro';--> statement-breakpoint

-- --- New subscription status: read_only (lapse / expired-trial, spec §C) ------
ALTER TYPE "subscription_status" ADD VALUE IF NOT EXISTS 'read_only';--> statement-breakpoint

-- --- users: one-time Trial columns (spec §A, all nullable) -------------------
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trial_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trial_ends_at" timestamp with time zone;--> statement-breakpoint
-- Durable one-time-trial guard: set once, never cleared (spec §A.2 / §E.3).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trial_consumed_at" timestamp with time zone;--> statement-breakpoint
-- Plan a card-required trial converts to at day 31 (spec §A.3). Uses the tier
-- enum; the value 'starter' added above is available to new rows/updates.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "post_trial_plan" "subscription_tier";--> statement-breakpoint

-- --- users: §D migration audit (all nullable) --------------------------------
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "migration_notice_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "migration_path" varchar(20);--> statement-breakpoint

-- --- trial_email_guard (spec §E) --------------------------------------------
-- Pseudonymised repeat-trial guard. Holds ONLY an HMAC-SHA256 of the normalised
-- email (hex) plus timestamps — no plaintext email, no other identifying column.
CREATE TABLE IF NOT EXISTS "trial_email_guard" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email_hash" varchar(64) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  CONSTRAINT "trial_email_guard_email_hash_unique" UNIQUE ("email_hash")
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trial_email_guard_expiry_idx"
  ON "trial_email_guard" ("expires_at");

-- --- ROLLBACK (down) ---------------------------------------------------------
-- Column / table additions are reversible; enum value additions are NOT (see
-- header). To roll back the schema portion that CAN be reversed:
--
--   DROP TABLE IF EXISTS "trial_email_guard";
--   ALTER TABLE "users" DROP COLUMN IF EXISTS "migration_path";
--   ALTER TABLE "users" DROP COLUMN IF EXISTS "migration_notice_sent_at";
--   ALTER TABLE "users" DROP COLUMN IF EXISTS "post_trial_plan";
--   ALTER TABLE "users" DROP COLUMN IF EXISTS "trial_consumed_at";
--   ALTER TABLE "users" DROP COLUMN IF EXISTS "trial_ends_at";
--   ALTER TABLE "users" DROP COLUMN IF EXISTS "trial_started_at";
--
-- The 'starter' and 'read_only' enum values remain; disable them in code
-- (PRICING_V3_ENABLED=false) rather than dropping the enum.
