-- users.session_version (JWT invalidation on password change) and one company
-- per user. Idempotent; de-dupes before the unique index so it can't fail.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "session_version" integer NOT NULL DEFAULT 0;

DELETE FROM "company_members" m
USING (
  SELECT "id", row_number() OVER (
    PARTITION BY "user_id" ORDER BY "created_at" ASC, "id" ASC
  ) AS rn
  FROM "company_members"
) d
WHERE m."id" = d."id" AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "company_members_user_unique" ON "company_members" ("user_id");
