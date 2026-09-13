-- Accountant discovery: companies opt into the accountant marketplace.
-- Additive and idempotent (IF NOT EXISTS), matching the hand-written style of
-- 0006/0010. Existing companies get accountant_discoverable = false, so nobody
-- becomes discoverable without explicitly opting in. No existing data changes.

ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "accountant_discoverable" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "industry" varchar(80);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "discovery_description" text;
--> statement-breakpoint
-- Partial index: discovery queries only ever scan opted-in companies.
CREATE INDEX IF NOT EXISTS "companies_discoverable_idx"
  ON "companies" ("accountant_discoverable") WHERE "accountant_discoverable" = true;
