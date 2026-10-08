-- Notification muting. users.notif_sound_muted = global sound off; chat_mutes =
-- per-chat (no toast/sound). Additive + idempotent.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notif_sound_muted" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_mutes" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "client_id" uuid NOT NULL REFERENCES "accountant_clients"("id") ON DELETE CASCADE,
  PRIMARY KEY ("user_id", "client_id")
);
