-- Negotiated seat count for Enterprise owners. Additive + idempotent.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "custom_seats" integer;
