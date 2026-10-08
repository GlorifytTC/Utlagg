-- Own-model shadow reads. Every scanned receipt is now also read by the free
-- local pipeline (Tesseract + parser + learned vendors), and its result is
-- stored next to Gemini's so both can be scored against what the user
-- confirmed. local_result has the same shape as ai_result; local_confidence is
-- Tesseract's mean confidence (0-100). Rows where only the own model ran use
-- source = 'local' and a NULL ai_result. Additive + idempotent.
ALTER TABLE "receipt_training_data" ADD COLUMN IF NOT EXISTS "local_result" jsonb;
--> statement-breakpoint
ALTER TABLE "receipt_training_data" ADD COLUMN IF NOT EXISTS "local_confidence" real;
