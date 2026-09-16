-- Chat messages and reports.
-- chat_messages: per accountant<->company relationship channel.
-- chat_reports: moderation queue, reviewed in admin panel.

DO $$ BEGIN
  CREATE TYPE "chat_report_status" AS ENUM ('pending', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid NOT NULL,
  "sender_id" uuid NOT NULL,
  "sender_role" varchar(10) NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_client_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "accountant_clients"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fk"
    FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_client_idx" ON "chat_messages" ("client_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reporter_id" uuid NOT NULL,
  "reported_user_id" uuid NOT NULL,
  "message_id" uuid,
  "reason" text NOT NULL,
  "status" "chat_report_status" DEFAULT 'pending' NOT NULL,
  "moderator_id" uuid,
  "moderator_note" text,
  "moderated_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_reporter_id_fk"
    FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_reported_user_id_fk"
    FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_message_id_fk"
    FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_moderator_id_fk"
    FOREIGN KEY ("moderator_id") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_reports_status_idx" ON "chat_reports" ("status");
