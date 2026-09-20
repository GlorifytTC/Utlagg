-- Accounting firms with roles + per-worker customer assignments.
-- Additive + idempotent. BACKFILLS: every accountant gets a solo firm (as
-- owner) and their existing accountant_clients rows get firm_id set. Safe to
-- re-run (creates a firm / membership / firm_id only where missing).

DO $$ BEGIN
  CREATE TYPE "firm_role" AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "accounting_firms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "logo_url" text,
  "owner_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "accounting_firms" ADD CONSTRAINT "accounting_firms_owner_id_users_id_fk"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accounting_firms_owner_idx" ON "accounting_firms" ("owner_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "firm_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" "firm_role" DEFAULT 'member' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "firm_members" ADD CONSTRAINT "firm_members_firm_id_accounting_firms_id_fk"
    FOREIGN KEY ("firm_id") REFERENCES "accounting_firms"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "firm_members" ADD CONSTRAINT "firm_members_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "firm_members_firm_idx" ON "firm_members" ("firm_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "firm_members_user_idx" ON "firm_members" ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "firm_members_pair_idx" ON "firm_members" ("firm_id","user_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "firm_invites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "email" varchar(320) NOT NULL,
  "token_hash" varchar(64) NOT NULL,
  "role" "firm_role" DEFAULT 'member' NOT NULL,
  "status" "accountant_rel_status" DEFAULT 'pending' NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "accepted_at" timestamp with time zone,
  "accepted_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "firm_invites" ADD CONSTRAINT "firm_invites_firm_id_accounting_firms_id_fk"
    FOREIGN KEY ("firm_id") REFERENCES "accounting_firms"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "firm_invites" ADD CONSTRAINT "firm_invites_accepted_by_users_id_fk"
    FOREIGN KEY ("accepted_by") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "firm_invites_firm_idx" ON "firm_invites" ("firm_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "firm_invites_email_idx" ON "firm_invites" ("email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "firm_invites_token_idx" ON "firm_invites" ("token_hash");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "worker_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "worker_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "assigned_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "worker_assignments" ADD CONSTRAINT "worker_assignments_firm_id_accounting_firms_id_fk"
    FOREIGN KEY ("firm_id") REFERENCES "accounting_firms"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "worker_assignments" ADD CONSTRAINT "worker_assignments_worker_id_users_id_fk"
    FOREIGN KEY ("worker_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "worker_assignments" ADD CONSTRAINT "worker_assignments_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "worker_assignments" ADD CONSTRAINT "worker_assignments_assigned_by_users_id_fk"
    FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "worker_assignments_worker_idx" ON "worker_assignments" ("worker_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "worker_assignments_company_idx" ON "worker_assignments" ("company_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "worker_assignments_firm_idx" ON "worker_assignments" ("firm_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "worker_assignments_pair_idx" ON "worker_assignments" ("worker_id","company_id");
--> statement-breakpoint

-- accountant_clients.firm_id (nullable; backfilled below)
ALTER TABLE "accountant_clients" ADD COLUMN IF NOT EXISTS "firm_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "accountant_clients" ADD CONSTRAINT "accountant_clients_firm_id_accounting_firms_id_fk"
    FOREIGN KEY ("firm_id") REFERENCES "accounting_firms"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accountant_clients_firm_idx" ON "accountant_clients" ("firm_id");
--> statement-breakpoint

-- BACKFILL (idempotent): one solo firm per accountant (owner), then set firm_id.
INSERT INTO "accounting_firms" ("name", "owner_id")
SELECT COALESCE(NULLIF(u.name, ''), split_part(u.email, '@', 1)) || ' (byrå)', u.id
FROM "users" u
WHERE u.is_accountant = true
  AND NOT EXISTS (SELECT 1 FROM "firm_members" fm WHERE fm.user_id = u.id);
--> statement-breakpoint
INSERT INTO "firm_members" ("firm_id", "user_id", "role")
SELECT f.id, f.owner_id, 'owner'
FROM "accounting_firms" f
WHERE f.owner_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "firm_members" fm WHERE fm.firm_id = f.id AND fm.user_id = f.owner_id
  );
--> statement-breakpoint
UPDATE "accountant_clients" ac
SET "firm_id" = fm.firm_id
FROM "firm_members" fm
WHERE ac.firm_id IS NULL
  AND fm.user_id = ac.accountant_id;
