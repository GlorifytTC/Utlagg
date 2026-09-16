-- Accountant reviews. One review per company per accountant (unique index).
-- Only companies with an active accountant_clients relationship may submit.
-- Additive and idempotent.
CREATE TABLE IF NOT EXISTS "accountant_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "accountant_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "reviewed_by" uuid,
  "rating" integer NOT NULL,
  "comment" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "accountant_reviews_rating_check" CHECK (rating >= 1 AND rating <= 5)
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "accountant_reviews" ADD CONSTRAINT "accountant_reviews_accountant_id_fk"
    FOREIGN KEY ("accountant_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "accountant_reviews" ADD CONSTRAINT "accountant_reviews_company_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "accountant_reviews" ADD CONSTRAINT "accountant_reviews_reviewed_by_fk"
    FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accountant_reviews_acct_idx" ON "accountant_reviews" ("accountant_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "accountant_reviews_pair_idx" ON "accountant_reviews" ("accountant_id", "company_id");
