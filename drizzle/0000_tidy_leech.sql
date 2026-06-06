DROP TYPE IF EXISTS "approval_status" CASCADE;
DROP TYPE IF EXISTS "receipt_status" CASCADE;
DROP TYPE IF EXISTS "subscription_status" CASCADE;
DROP TYPE IF EXISTS "subscription_tier" CASCADE;
DROP TYPE IF EXISTS "user_role" CASCADE;

CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."receipt_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'pro', 'business', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(120) NOT NULL,
	"details" text,
	"ip_address" varchar(64),
	"entity_type" varchar(50),
	"entity_id" varchar(255),
	"old_values" jsonb,
	"new_values" jsonb,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"receipt_id" uuid,
	"description" text,
	"amount" numeric(12, 2),
	"date" timestamp with time zone,
	"approval_status" "approval_status" DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"mileage_km" real,
	"carbon_kg" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(40) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"scope" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"image_url" text,
	"vendor_name" varchar(300),
	"date" timestamp with time zone,
	"total_amount" numeric(12, 2),
	"vat_amount" numeric(12, 2),
	"vat_rate" integer,
	"category" varchar(120),
	"bas_code" varchar(10),
	"status" "receipt_status" DEFAULT 'pending' NOT NULL,
	"ai_confidence" real,
	"receipt_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_customer_id" varchar(120),
	"stripe_subscription_id" varchar(120),
	"tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_end" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"hashed_password" text,
	"name" varchar(200),
	"company_name" varchar(200),
	"role" "user_role" DEFAULT 'admin' NOT NULL,
	"subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"subscription_status" "subscription_status" DEFAULT 'active' NOT NULL,
	"scans_used_this_month" integer DEFAULT 0 NOT NULL,
	"scan_limit" integer DEFAULT 25 NOT NULL,
	"usage_reset_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email_verified" timestamp with time zone,
	"email_verification_token" varchar(255),
	"email_verification_token_expires" timestamp with time zone,
	"password_reset_token" varchar(255),
	"password_reset_token_expires" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"type" varchar(120) NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_receipt_id_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_tokens" ADD CONSTRAINT "integration_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "integration_user_provider_idx" ON "integration_tokens" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "receipts_user_idx" ON "receipts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "receipts_date_idx" ON "receipts" USING btree ("date");