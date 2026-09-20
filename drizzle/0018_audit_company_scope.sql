-- Add target_company_id to audit_logs so accountant events can be
-- efficiently queried by client company (without parsing the details field).
-- Nullable so all existing rows stay valid.
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "target_company_id" uuid REFERENCES "companies"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_target_company_idx" ON "audit_logs" ("target_company_id");
