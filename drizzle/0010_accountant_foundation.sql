-- Accountant ecosystem — Phase 1 foundation.
-- Purely ADDITIVE and idempotent (IF NOT EXISTS / guarded), matching the
-- hand-written style of 0006_catchup. Safe to apply to a DB that already has
-- some of these objects, and safe to re-run. Adds:
--   * enum accountant_rel_status
--   * users.is_accountant
--   * receipts.note, receipts.reviewed_at, receipts.reviewed_by
--   * tables accountant_clients, accountant_invites,
--     accountant_connection_requests, accountant_exports
-- Does NOT modify any existing column, table, constraint, or data.

-- 1. Relationship-status enum (create only if absent).
DO $$ BEGIN
  CREATE TYPE "accountant_rel_status" AS ENUM ('pending', 'active', 'revoked');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- 2. users.is_accountant
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "is_accountant" boolean DEFAULT false NOT NULL;
--> statement-breakpoint

-- 3. receipts accountant-review fields (all nullable, additive)
ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "note" text;
--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "reviewed_by" uuid;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "receipts"
    ADD CONSTRAINT "receipts_reviewed_by_users_id_fk"
    FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- 4. accountant_clients
CREATE TABLE IF NOT EXISTS "accountant_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accountant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"status" "accountant_rel_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activated_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"revoked_by" uuid
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "accountant_clients" ADD CONSTRAINT "accountant_clients_accountant_id_users_id_fk"
    FOREIGN KEY ("accountant_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "accountant_clients" ADD CONSTRAINT "accountant_clients_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "accountant_clients" ADD CONSTRAINT "accountant_clients_revoked_by_users_id_fk"
    FOREIGN KEY ("revoked_by") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accountant_clients_acct_idx" ON "accountant_clients" ("accountant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accountant_clients_company_idx" ON "accountant_clients" ("company_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "accountant_clients_pair_idx" ON "accountant_clients" ("accountant_id","company_id");
--> statement-breakpoint

-- 5. accountant_invites
CREATE TABLE IF NOT EXISTS "accountant_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accountant_id" uuid NOT NULL,
	"email" varchar(320) NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"status" "accountant_rel_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by" uuid,
	"company_id" uuid,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "accountant_invites" ADD CONSTRAINT "accountant_invites_accountant_id_users_id_fk"
    FOREIGN KEY ("accountant_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "accountant_invites" ADD CONSTRAINT "accountant_invites_accepted_by_users_id_fk"
    FOREIGN KEY ("accepted_by") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "accountant_invites" ADD CONSTRAINT "accountant_invites_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accountant_invites_email_idx" ON "accountant_invites" ("email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accountant_invites_acct_idx" ON "accountant_invites" ("accountant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accountant_invites_token_idx" ON "accountant_invites" ("token_hash");
--> statement-breakpoint

-- 6. accountant_connection_requests
CREATE TABLE IF NOT EXISTS "accountant_connection_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"accountant_id" uuid NOT NULL,
	"requested_by" uuid,
	"status" "accountant_rel_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "accountant_connection_requests" ADD CONSTRAINT "accountant_connection_requests_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "accountant_connection_requests" ADD CONSTRAINT "accountant_connection_requests_accountant_id_users_id_fk"
    FOREIGN KEY ("accountant_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "accountant_connection_requests" ADD CONSTRAINT "accountant_connection_requests_requested_by_users_id_fk"
    FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accountant_conn_req_acct_idx" ON "accountant_connection_requests" ("accountant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accountant_conn_req_company_idx" ON "accountant_connection_requests" ("company_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "accountant_conn_req_pair_idx" ON "accountant_connection_requests" ("company_id","accountant_id");
--> statement-breakpoint

-- 7. accountant_exports
CREATE TABLE IF NOT EXISTS "accountant_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accountant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"from_date" varchar(10),
	"to_date" varchar(10),
	"format" varchar(10) DEFAULT 'csv' NOT NULL,
	"receipt_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "accountant_exports" ADD CONSTRAINT "accountant_exports_accountant_id_users_id_fk"
    FOREIGN KEY ("accountant_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "accountant_exports" ADD CONSTRAINT "accountant_exports_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accountant_exports_acct_company_idx" ON "accountant_exports" ("accountant_id","company_id");
