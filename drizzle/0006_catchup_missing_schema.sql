-- Catch-up migration: adds tables/columns that existed in the schema but were
-- never written into migration history (added via manual ALTERs in the past).
-- Written idempotently so it is safe to apply against a database that already
-- has some of these objects. Fixes the "column receipt_number does not exist"
-- server-side crash on the dashboard.

CREATE TABLE IF NOT EXISTS "company_vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"registration_number" varchar(10) NOT NULL,
	"model" varchar(100),
	"fuel_type" varchar(20) DEFAULT 'petrol' NOT NULL,
	"is_electric" boolean DEFAULT false NOT NULL,
	"assigned_to_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mileage_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"label" varchar(120) NOT NULL,
	"start_address" varchar(300) NOT NULL,
	"end_address" varchar(300) NOT NULL,
	"distance_km" numeric(10, 2) NOT NULL,
	"purpose" varchar(20) DEFAULT 'business' NOT NULL,
	"vehicle_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ocr_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"field" varchar(40) NOT NULL,
	"value" text,
	"vendor" varchar(300),
	"bbox_x" real,
	"bbox_y" real,
	"bbox_w" real,
	"bbox_h" real,
	"crop" text,
	"source" varchar(20) DEFAULT 'manual',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transport_passes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid,
	"pass_type" varchar(20) DEFAULT 'monthly' NOT NULL,
	"provider" varchar(50) DEFAULT 'SL' NOT NULL,
	"provider_other" varchar(100),
	"amount" numeric(12, 2) NOT NULL,
	"vat_rate" integer DEFAULT 6 NOT NULL,
	"vat_amount" numeric(12, 2),
	"valid_from" timestamp with time zone NOT NULL,
	"valid_to" timestamp with time zone NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"receipt_image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mileage_entries" ADD COLUMN IF NOT EXISTS "vehicle_id" uuid;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "receipt_number" varchar(60);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company_vehicles" ADD CONSTRAINT "company_vehicles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company_vehicles" ADD CONSTRAINT "company_vehicles_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mileage_routes" ADD CONSTRAINT "mileage_routes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mileage_routes" ADD CONSTRAINT "mileage_routes_vehicle_id_company_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."company_vehicles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ocr_samples" ADD CONSTRAINT "ocr_samples_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transport_passes" ADD CONSTRAINT "transport_passes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transport_passes" ADD CONSTRAINT "transport_passes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mileage_entries" ADD CONSTRAINT "mileage_entries_vehicle_id_company_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."company_vehicles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "company_vehicles_company_idx" ON "company_vehicles" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mileage_routes_user_idx" ON "mileage_routes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transport_passes_user_idx" ON "transport_passes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transport_passes_company_idx" ON "transport_passes" USING btree ("company_id");
