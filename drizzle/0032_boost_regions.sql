-- Boost capacity per region + fair rotation.
--  region       normalized accountant city at purchase ('' = no city / nationwide).
--               At most 10 boosts run at the same time per region; extra paid
--               boosts are queued (starts_at in the future).
--  impressions  times this boost was shown in a sponsored slot; the boosts with
--               the fewest impressions are shown first, so every payer gets an
--               equal share. Additive + idempotent.
ALTER TABLE "accountant_boosts" ADD COLUMN IF NOT EXISTS "region" varchar(100) DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "accountant_boosts" ADD COLUMN IF NOT EXISTS "impressions" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accountant_boosts_region_idx" ON "accountant_boosts" ("region", "expires_at");
--> statement-breakpoint
-- Existing boosts: take the accountant's current city (same normalization as lib/accountant-boost.ts regionKey).
UPDATE "accountant_boosts" b
SET "region" = lower(btrim(regexp_replace(u."accountant_city", '\s+', ' ', 'g')))
FROM "users" u
WHERE u."id" = b."accountant_id" AND b."region" = '' AND u."accountant_city" IS NOT NULL;
