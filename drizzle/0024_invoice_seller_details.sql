-- Seller payment + contact details on customer invoices (bankgiro, plusgiro,
-- IBAN/BIC, F-skatt, email, phone, website). Edited on the company, frozen onto
-- each invoice at issue time. Additive + idempotent.
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "invoice_details" jsonb;
ALTER TABLE "customer_invoices" ADD COLUMN IF NOT EXISTS "seller_details" jsonb;
