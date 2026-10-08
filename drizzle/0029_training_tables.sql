-- Catch-up: receipt_training_data and vendor_corrections exist in db/schema.ts
-- but were never created by a migration. Their writers (app/api/ocr/ai,
-- app/api/ocr/ai/confirm, lib/vendor-learning) swallow errors on purpose, so on
-- a database built from migrations every training capture and vendor lesson was
-- silently dropped. Idempotent: safe whether or not `db:push` already made them.

CREATE TABLE IF NOT EXISTS "receipt_training_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
	"image_data" text,
	"ai_result" jsonb,
	"source" varchar(20) DEFAULT 'gemini' NOT NULL,
	"confirmed_vendor" varchar(300),
	"confirmed_org_number" varchar(11),
	"confirmed_date" varchar(10),
	"confirmed_total" numeric(12, 2),
	"confirmed_vat" numeric(12, 2),
	"confirmed_vat_rate" integer,
	"was_corrected" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "receipt_training_user_idx" ON "receipt_training_data" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "receipt_training_corrected_idx" ON "receipt_training_data" ("was_corrected");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_corrections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_number" varchar(11),
	"ocr_text" varchar(300),
	"correct_vendor" varchar(300) NOT NULL,
	"bas_code" varchar(10),
	"times_confirmed" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vendor_corrections_org_idx" ON "vendor_corrections" ("org_number");
