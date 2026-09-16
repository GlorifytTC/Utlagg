-- Accountant marketplace profile fields. Additive, idempotent. Allows
-- accountants to set a city, short bio, and list of industry specializations
-- shown on their marketplace card. All nullable so existing rows are unaffected.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountant_city" varchar(100);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountant_bio" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountant_specializations" jsonb;
