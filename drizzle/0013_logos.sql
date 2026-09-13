-- Logos for companies and accountant users (base64 data URLs). Additive,
-- idempotent, matching the hand-written style of prior migrations.
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "logo_url" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "logo_url" text;
