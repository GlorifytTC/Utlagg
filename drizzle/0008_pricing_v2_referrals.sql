-- Pricing V2 + referral program.
-- Adds the "max" tier, per-billing-period scan metering, rollover credit packs,
-- overage spend-cap + grandfathering, and the referral reward machine.
-- Written idempotently (IF NOT EXISTS / guards) so it is safe to re-run and
-- safe on environments where earlier hand-applied migrations already ran.

-- --- New enum value: Max tier (kept before enterprise in the ordering) -------
ALTER TYPE "subscription_tier" ADD VALUE IF NOT EXISTS 'max' BEFORE 'enterprise';--> statement-breakpoint

-- --- New enums ---------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "referral_status" AS ENUM ('pending', 'vested', 'granted', 'void');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "billing_scope" AS ENUM ('user', 'company');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

-- --- users: referral columns -------------------------------------------------
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_code" varchar(32);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referred_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_normalized" varchar(320);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "signup_ip" varchar(64);--> statement-breakpoint

-- Backfill a non-guessable referral code for every existing user.
UPDATE "users"
  SET "referral_code" = upper(substr(md5(random()::text || "id"::text), 1, 10))
  WHERE "referral_code" IS NULL;--> statement-breakpoint

-- Backfill normalised email (lower-case; Gmail dot/+alias stripping is applied
-- in application code on new signups — this backfill is a lower-case baseline).
UPDATE "users"
  SET "email_normalized" = lower("email")
  WHERE "email_normalized" IS NULL;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_referral_code_unique" UNIQUE ("referral_code");
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_fk"
    FOREIGN KEY ("referred_by_user_id") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "users_email_normalized_idx" ON "users" ("email_normalized");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_referred_by_idx" ON "users" ("referred_by_user_id");--> statement-breakpoint

-- --- subscriptions: metering / grandfathering columns ------------------------
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "current_period_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "legacy_unlimited_scans" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "overage_spend_cap_ore" integer;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "stripe_card_fingerprint" varchar(64);--> statement-breakpoint

-- Grandfather every Pro subscription that exists at migration time: they were
-- sold "unlimited scans" and must NOT be silently capped at 500. The cap
-- applies only to Pro subscriptions created after rollout (default false).
-- TODO(pricing-v2): when the team is ready to migrate these to the 500-scan
-- plan, notify each affected subscriber first, then flip this flag to false.
UPDATE "subscriptions" SET "legacy_unlimited_scans" = true WHERE "tier" = 'pro';--> statement-breakpoint

-- --- scan_usage --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "scan_usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scope" "billing_scope" DEFAULT 'user' NOT NULL,
  "scope_id" uuid NOT NULL,
  "period_start" timestamp with time zone NOT NULL,
  "period_end" timestamp with time zone NOT NULL,
  "plan_scans_used" integer DEFAULT 0 NOT NULL,
  "overage_scans_used" integer DEFAULT 0 NOT NULL,
  "overage_billed_ore" integer DEFAULT 0 NOT NULL,
  "cap_reached" boolean DEFAULT false NOT NULL,
  "overage_flushed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "scan_usage_scope_period_idx"
  ON "scan_usage" ("scope", "scope_id", "period_start");--> statement-breakpoint

-- --- scan_credits ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "scan_credits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scope" "billing_scope" DEFAULT 'user' NOT NULL,
  "scope_id" uuid NOT NULL,
  "scans_total" integer NOT NULL,
  "scans_remaining" integer NOT NULL,
  "price_ore" integer NOT NULL,
  "purchased_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "stripe_ref" varchar(255),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "scan_credits_stripe_ref_unique" UNIQUE ("stripe_ref")
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scan_credits_scope_idx" ON "scan_credits" ("scope", "scope_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scan_credits_expiry_idx" ON "scan_credits" ("expires_at");--> statement-breakpoint

-- --- referral_rewards --------------------------------------------------------
CREATE TABLE IF NOT EXISTS "referral_rewards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "referrer_user_id" uuid NOT NULL,
  "referred_user_id" uuid NOT NULL,
  "status" "referral_status" DEFAULT 'pending' NOT NULL,
  "reward_days" integer NOT NULL,
  "trigger_invoice_id" varchar(255),
  "trigger_event_id" varchar(255),
  "vests_at" timestamp with time zone,
  "granted_at" timestamp with time zone,
  "voided_at" timestamp with time zone,
  "void_reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "referral_rewards_referred_user_unique" UNIQUE ("referred_user_id")
);--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referrer_fk"
    FOREIGN KEY ("referrer_user_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referred_fk"
    FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "referral_rewards_referrer_idx" ON "referral_rewards" ("referrer_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "referral_rewards_status_idx" ON "referral_rewards" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "referral_rewards_vests_idx" ON "referral_rewards" ("vests_at");
