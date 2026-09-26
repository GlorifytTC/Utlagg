-- Chat moderation: temporary/permanent bans and one-shot warnings.
-- Additive + idempotent.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banned_until" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pending_warning" text;
