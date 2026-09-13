-- Accountant Boost — one-time paid visibility (49 kr / 7 days). Additive and
-- idempotent, matching the hand-written style of 0006/0010/0011. Server/webhook
-- controls all state; the unique session index guarantees webhook idempotency.

DO $$ BEGIN
  CREATE TYPE "accountant_boost_status" AS ENUM ('pending', 'active', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "accountant_boosts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "accountant_id" uuid NOT NULL,
  "status" "accountant_boost_status" DEFAULT 'pending' NOT NULL,
  "stripe_checkout_session_id" varchar(255),
  "stripe_payment_intent_id" varchar(255),
  "amount" integer,
  "currency" varchar(3),
  "starts_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "accountant_boosts" ADD CONSTRAINT "accountant_boosts_accountant_id_users_id_fk"
    FOREIGN KEY ("accountant_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accountant_boosts_acct_idx" ON "accountant_boosts" ("accountant_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "accountant_boosts_session_idx" ON "accountant_boosts" ("stripe_checkout_session_id");
