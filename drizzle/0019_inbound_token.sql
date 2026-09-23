-- Per-user inbound-email token: forms the forwarding address
-- kvitto+<token>@<inbound domain> used to ingest digital receipts (emailed
-- receipts and forwarded Kivra PDFs) without OCR. Nullable / lazily generated
-- on first view, so existing rows stay valid.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "inbound_token" varchar(32);
--> statement-breakpoint
-- Unique enforcement via index (idempotent, matches the hand-authored migration
-- style in this folder). One address per user; lookups are by this token.
CREATE UNIQUE INDEX IF NOT EXISTS "users_inbound_token_unique" ON "users" ("inbound_token");
