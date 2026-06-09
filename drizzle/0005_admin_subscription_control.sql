ALTER TABLE "users" ADD COLUMN "subscription_source" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_granted_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_paused" boolean DEFAULT false NOT NULL;