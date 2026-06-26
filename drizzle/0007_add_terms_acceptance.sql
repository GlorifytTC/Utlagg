-- Adds terms-acceptance tracking so registration can require and record
-- explicit consent to the data-retention policy (7-year Bokföringslagen
-- requirement for receipts, independent of subscription status).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "terms_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "terms_version" varchar(20);
