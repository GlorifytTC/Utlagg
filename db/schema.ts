import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  numeric,
  real,
  boolean,
  pgEnum,
  uuid,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* Enums                                                              */
/* ------------------------------------------------------------------ */

export const userRole = pgEnum("user_role", ["admin", "member"]);

/** Role of a user *within a company*. */
export const companyRole = pgEnum("company_role", [
  "owner",
  "admin",
  "approver",
  "member",
]);
export const subscriptionTier = pgEnum("subscription_tier", [
  "free",
  "pro",
  "business",
  "enterprise",
]);
export const subscriptionStatus = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "trialing",
  "incomplete",
]);
export const receiptStatus = pgEnum("receipt_status", [
  "pending",
  "approved",
  "rejected",
]);
export const approvalStatus = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
]);

/* ------------------------------------------------------------------ */
/* users                                                              */
/* ------------------------------------------------------------------ */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  hashedPassword: text("hashed_password"), // nullable: BankID users have none
  // SHA-256 of the BankID personnummer — lets us match returning BankID users
  // without storing the raw personal number. Nullable + unique.
  bankIdSubject: varchar("bank_id_subject", { length: 64 }).unique(),
  name: varchar("name", { length: 200 }),
  companyName: varchar("company_name", { length: 200 }),
  role: userRole("role").notNull().default("member"),
  subscriptionTier: subscriptionTier("subscription_tier")
    .notNull()
    .default("free"),
  subscriptionStatus: subscriptionStatus("subscription_status")
    .notNull()
    .default("active"),
  scansUsedThisMonth: integer("scans_used_this_month").notNull().default(0),
  // -1 represents "unlimited" for paid tiers
  scanLimit: integer("scan_limit").notNull().default(25),
  // tracks when the monthly counter was last reset
  usageResetAt: timestamp("usage_reset_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // --- Email verification + password reset (phase 6, all nullable) ---
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  emailVerificationTokenExpires: timestamp("email_verification_token_expires", {
    withTimezone: true,
  }),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetTokenExpires: timestamp("password_reset_token_expires", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------------------------------------------ */
/* receipts                                                           */
/* ------------------------------------------------------------------ */

export const receipts = pgTable(
  "receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    imageUrl: text("image_url"),
    vendorName: varchar("vendor_name", { length: 300 }),
    date: timestamp("date", { withTimezone: true }),
    // money stored as numeric to avoid float rounding errors
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
    vatAmount: numeric("vat_amount", { precision: 12, scale: 2 }),
    // 6 | 12 | 25 — stored as integer percentage
    vatRate: integer("vat_rate"),
    category: varchar("category", { length: 120 }),
    basCode: varchar("bas_code", { length: 10 }), // Swedish BAS account code
    status: receiptStatus("status").notNull().default("pending"),
    aiConfidence: real("ai_confidence"),
    receiptText: text("receipt_text"), // raw OCR text — kept for audit
    // Fortnox sync state
    fortnoxSynced: boolean("fortnox_synced").notNull().default(false),
    fortnoxSyncedAt: timestamp("fortnox_synced_at", { withTimezone: true }),
    fortnoxVoucherId: varchar("fortnox_voucher_id", { length: 64 }),
    // Company scoping (nullable: solo users have no company)
    companyId: uuid("company_id"),
    // SHA-256 of the stored image bytes — tamper-evidence (Bokföringslagen 2024)
    fileHash: varchar("file_hash", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("receipts_user_idx").on(t.userId),
    dateIdx: index("receipts_date_idx").on(t.date),
  }),
);

/* ------------------------------------------------------------------ */
/* expenses                                                           */
/* ------------------------------------------------------------------ */

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  receiptId: uuid("receipt_id").references(() => receipts.id, {
    onDelete: "set null",
  }),
  description: text("description"),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  date: timestamp("date", { withTimezone: true }),
  approvalStatus: approvalStatus("approval_status")
    .notNull()
    .default("pending"),
  approvedBy: uuid("approved_by").references(() => users.id),
  mileageKm: real("mileage_km"),
  carbonKg: real("carbon_kg"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------------------------------------------ */
/* audit_logs  (7-year retention — Bokföringslagen)                   */
/* ------------------------------------------------------------------ */

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 120 }).notNull(),
    details: text("details"),
    ipAddress: varchar("ip_address", { length: 64 }),
    // --- Optional richer context (added in phase 3, all nullable so existing
    //     logAudit() callers keep working unchanged) ---
    entityType: varchar("entity_type", { length: 50 }),
    entityId: varchar("entity_id", { length: 255 }),
    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("audit_user_idx").on(t.userId),
    createdIdx: index("audit_created_idx").on(t.createdAt),
  }),
);

/* ------------------------------------------------------------------ */
/* subscriptions                                                      */
/* ------------------------------------------------------------------ */

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 120 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 120 }),
  tier: subscriptionTier("tier").notNull().default("free"),
  status: subscriptionStatus("status").notNull().default("active"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
});

/* ------------------------------------------------------------------ */
/* integration_tokens (OAuth tokens for Fortnox etc.)                 */
/* ------------------------------------------------------------------ */

export const integrationTokens = pgTable(
  "integration_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 40 }).notNull(), // e.g. "fortnox"
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    scope: text("scope"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userProviderIdx: index("integration_user_provider_idx").on(
      t.userId,
      t.provider,
    ),
  }),
);

/* ------------------------------------------------------------------ */
/* companies / company_members / company_invites (team model)          */
/* ------------------------------------------------------------------ */

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  orgNumber: varchar("org_number", { length: 12 }), // svenskt organisationsnummer
  vatNumber: varchar("vat_number", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 2 }).notNull().default("SE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const companyMembers = pgTable(
  "company_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: companyRole("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    companyIdx: index("company_members_company_idx").on(t.companyId),
    userIdx: index("company_members_user_idx").on(t.userId),
  }),
);

export const companyInvites = pgTable(
  "company_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 320 }).notNull(),
    role: companyRole("role").notNull().default("member"),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(), // sha256 of raw token
    invitedBy: uuid("invited_by").references(() => users.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ emailIdx: index("company_invites_email_idx").on(t.email) }),
);

/* ------------------------------------------------------------------ */
/* customer_invoices (kundfakturor — invoices the company sends out)    */
/* ------------------------------------------------------------------ */

export const customerInvoices = pgTable(
  "customer_invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    invoiceNumber: varchar("invoice_number", { length: 40 }).notNull(),
    // Seller snapshot (the company's own details, frozen at issue time)
    sellerName: varchar("seller_name", { length: 255 }).notNull(),
    sellerOrgNumber: varchar("seller_org_number", { length: 12 }),
    sellerVatNumber: varchar("seller_vat_number", { length: 50 }),
    sellerAddress: text("seller_address"),
    // Buyer
    buyerName: varchar("buyer_name", { length: 255 }).notNull(),
    buyerOrgNumber: varchar("buyer_org_number", { length: 20 }),
    buyerVatNumber: varchar("buyer_vat_number", { length: 50 }),
    buyerAddress: text("buyer_address"),
    issueDate: timestamp("issue_date", { withTimezone: true }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    reverseCharge: boolean("reverse_charge").notNull().default(false),
    currency: varchar("currency", { length: 3 }).notNull().default("SEK"),
    lineItems: jsonb("line_items").notNull(), // [{description, quantity, unitPrice, vatRate}]
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    vatTotal: numeric("vat_total", { precision: 12, scale: 2 }).notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    note: text("note"),
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ companyIdx: index("customer_invoices_company_idx").on(t.companyId) }),
);

/* ------------------------------------------------------------------ */
/* mileage_entries (Milersättning)                                     */
/* ------------------------------------------------------------------ */

// Skatteverket tax-free rate for own car, 2026: 25 kr/mil = 2.50 kr/km.
// (Per *mil* = 10 km. 18.50 kr/mil was the old pre-2023 rate.)
export const MILEAGE_RATE_PER_KM = 2.5;

export const mileageEntries = pgTable(
  "mileage_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startAddress: text("start_address").notNull(),
    endAddress: text("end_address").notNull(),
    distanceKm: numeric("distance_km", { precision: 10, scale: 2 }).notNull(),
    ratePerKm: numeric("rate_per_km", { precision: 6, scale: 2 }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    purpose: varchar("purpose", { length: 20 }).notNull().default("business"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({ userIdx: index("mileage_user_idx").on(t.userId) }),
);

/* ------------------------------------------------------------------ */
/* approval_requests (Attestflöden)                                    */
/* ------------------------------------------------------------------ */

export const approvalRequests = pgTable(
  "approval_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    approverEmail: varchar("approver_email", { length: 320 }).notNull(),
    receiptId: uuid("receipt_id").references(() => receipts.id, {
      onDelete: "set null",
    }),
    mileageId: uuid("mileage_id").references(() => mileageEntries.id, {
      onDelete: "set null",
    }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    status: approvalStatus("status").notNull().default("pending"),
    requesterComment: text("requester_comment"),
    approverComment: text("approver_comment"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    requesterIdx: index("approval_requester_idx").on(t.requesterId),
    approverIdx: index("approval_approver_idx").on(t.approverEmail),
  }),
);

/* ------------------------------------------------------------------ */
/* webhook_events (Stripe idempotency — process each event once)       */
/* ------------------------------------------------------------------ */

export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id", { length: 255 }).primaryKey(), // Stripe event id (evt_...)
  type: varchar("type", { length: 120 }).notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Relations                                                          */
/* ------------------------------------------------------------------ */

export const usersRelations = relations(users, ({ many, one }) => ({
  receipts: many(receipts),
  expenses: many(expenses),
  subscription: one(subscriptions),
}));

export const receiptsRelations = relations(receipts, ({ one, many }) => ({
  user: one(users, { fields: [receipts.userId], references: [users.id] }),
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, { fields: [expenses.userId], references: [users.id] }),
  receipt: one(receipts, {
    fields: [expenses.receiptId],
    references: [receipts.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

/* ------------------------------------------------------------------ */
/* Inferred types                                                     */
/* ------------------------------------------------------------------ */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Receipt = typeof receipts.$inferSelect;
export type NewReceipt = typeof receipts.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type IntegrationToken = typeof integrationTokens.$inferSelect;
export type MileageEntry = typeof mileageEntries.$inferSelect;
export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type CompanyMember = typeof companyMembers.$inferSelect;
