-- Record when a customer invoice (kundfaktura) is paid. Under the Swedish cash
-- method (kontantmetoden), revenue and output VAT are recognised at payment,
-- not at issue. paid_at holds the payment date; status = 'paid' flags it.
-- Additive + idempotent.
ALTER TABLE "customer_invoices" ADD COLUMN IF NOT EXISTS "paid_at" timestamptz;
