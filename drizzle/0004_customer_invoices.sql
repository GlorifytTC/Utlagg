CREATE TABLE "customer_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"created_by_id" uuid,
	"invoice_number" varchar(40) NOT NULL,
	"seller_name" varchar(255) NOT NULL,
	"seller_org_number" varchar(12),
	"seller_vat_number" varchar(50),
	"seller_address" text,
	"buyer_name" varchar(255) NOT NULL,
	"buyer_org_number" varchar(20),
	"buyer_vat_number" varchar(50),
	"buyer_address" text,
	"issue_date" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone,
	"reverse_charge" boolean DEFAULT false NOT NULL,
	"currency" varchar(3) DEFAULT 'SEK' NOT NULL,
	"line_items" jsonb NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"vat_total" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"note" text,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_invoices" ADD CONSTRAINT "customer_invoices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_invoices" ADD CONSTRAINT "customer_invoices_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_invoices_company_idx" ON "customer_invoices" USING btree ("company_id");