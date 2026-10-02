-- One row per accountant who reviewed a receipt (several can). Additive + idempotent.
CREATE TABLE IF NOT EXISTS "receipt_reviews" (
  "receipt_id" uuid NOT NULL REFERENCES "receipts"("id") ON DELETE CASCADE,
  "accountant_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "reviewed_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "receipt_reviews_pk" ON "receipt_reviews" ("receipt_id", "accountant_id");
--> statement-breakpoint
INSERT INTO "receipt_reviews" ("receipt_id", "accountant_id", "reviewed_at")
SELECT "id", "reviewed_by", COALESCE("reviewed_at", now()) FROM "receipts" WHERE "reviewed_by" IS NOT NULL
ON CONFLICT DO NOTHING;
