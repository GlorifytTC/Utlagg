-- Capture the invitee's name on a company invite, so the pre-created account
-- has it. Additive + idempotent.
ALTER TABLE "company_invites" ADD COLUMN IF NOT EXISTS "invitee_name" varchar(200);
