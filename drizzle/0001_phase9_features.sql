CREATE TABLE "approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"approver_email" varchar(320) NOT NULL,
	"receipt_id" uuid,
	"mileage_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"requester_comment" text,
	"approver_comment" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mileage_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"start_address" text NOT NULL,
	"end_address" text NOT NULL,
	"distance_km" numeric(10, 2) NOT NULL,
	"rate_per_km" numeric(6, 2) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"purpose" varchar(20) DEFAULT 'business' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "fortnox_synced" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "fortnox_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "fortnox_voucher_id" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bank_id_subject" varchar(64);--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_receipt_id_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_mileage_id_mileage_entries_id_fk" FOREIGN KEY ("mileage_id") REFERENCES "public"."mileage_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mileage_entries" ADD CONSTRAINT "mileage_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approval_requester_idx" ON "approval_requests" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "approval_approver_idx" ON "approval_requests" USING btree ("approver_email");--> statement-breakpoint
CREATE INDEX "mileage_user_idx" ON "mileage_entries" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_bank_id_subject_unique" UNIQUE("bank_id_subject");