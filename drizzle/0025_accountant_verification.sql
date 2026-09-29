-- Accountant credential verification. Additive + idempotent.
-- An accountant uploads a credential scan (private R2 object), an admin
-- approves or rejects it, and approved accountants get a "Verified" badge.
DO $$ BEGIN
  CREATE TYPE "accountant_verification_status" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_status" "accountant_verification_status";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_doc_key" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_note" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_updated_at" timestamp with time zone;
