-- Capture the invitee's name on a firm invite, so the pre-created account has
-- it. Additive + idempotent.
ALTER TABLE "firm_invites" ADD COLUMN IF NOT EXISTS "invitee_name" varchar(200);
