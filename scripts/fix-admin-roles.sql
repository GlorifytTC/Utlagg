-- Fix existing users' roles after the default was changed from 'admin' to 'member'.
-- Run this ONCE against your database (e.g. `psql "$DIRECT_URL" -f scripts/fix-admin-roles.sql`).
--
-- IMPORTANT: the role column is the enum user_role ('admin' | 'member').
-- There is no 'user' value — 'member' is the regular (non-admin) role.
--
-- 1) Replace the email(s) below with YOUR real admin account(s) before running.
-- 2) This demotes everyone else to 'member' and promotes only your account(s).

BEGIN;

-- Belt-and-suspenders: ensure the column default is correct even if you
-- haven't run the Drizzle migration 0002_role_default_member.
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member';

-- Demote ALL users to regular members...
UPDATE "users"
SET "role" = 'member'
WHERE "email" NOT IN ('georgegqweqwelor40@hotmail.com');

-- ...then promote only your admin account(s).
UPDATE "users"
SET "role" = 'admin'
WHERE "email" IN ('georgegqweqwelor40@hotmail.com');

COMMIT;

-- Verify:
--   SELECT email, role FROM users ORDER BY role, email;
