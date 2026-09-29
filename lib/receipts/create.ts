/**
 * Shared receipt-creation core. The single place a receipt row is born, no
 * matter the intake channel - the manual/scan API (POST /api/receipts) and the
 * inbound-email webhook (POST /api/inbound/email) both route through here, so
 * metering, member-approval, auto-categorization and the audit trail stay
 * identical across channels. Do NOT re-implement any of this in a caller.
 */

import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { receipts, companyMembers } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { getUserCompany } from "@/lib/company";
import { suggestBasCode } from "@/lib/auto-categorize";
import { getBasAccount } from "@/lib/bas";
import { meterScan, type MeterOutcome } from "@/lib/billing/metering";

export interface CreateReceiptInput {
  imageUrl?: string;
  receiptNumber?: string;
  vendorName?: string | null;
  /** ISO string or Date; undefined leaves the column unset. */
  date?: string | Date | null;
  totalAmount?: number | null;
  vatAmount?: number | null;
  vatRate?: 6 | 12 | 25 | null;
  category?: string;
  basCode?: string;
  aiConfidence?: number;
  receiptText?: string;
}

export type CreateReceiptResult =
  | { ok: true; receipt: typeof receipts.$inferSelect }
  | { ok: false; meter: MeterOutcome };

/**
 * True when `userId`'s receipts must be approved by someone else: a plain
 * member of a company that has an owner/admin/approver besides them. Such a
 * user may never set a receipt's status themselves.
 */
export async function needsApproval(
  userId: string,
  membership?: Awaited<ReturnType<typeof getUserCompany>>,
): Promise<boolean> {
  if (membership === undefined) membership = await getUserCompany(userId);
  if (!membership || membership.role !== "member") return false;
  const approvers = await db
    .select({ id: companyMembers.id })
    .from(companyMembers)
    .where(
      and(
        eq(companyMembers.companyId, membership.companyId),
        ne(companyMembers.userId, userId),
        inArray(companyMembers.role, ["owner", "admin", "approver"]),
      ),
    )
    .limit(1);
  return approvers.length > 0;
}

/**
 * Create a receipt for `userId`. Enforces the scan quota (the sole metering
 * choke-point), sets pending/approved status by company role, auto-categorizes
 * from the vendor name when no BAS code was given, inserts the row and writes
 * an audit entry. Returns `{ ok:false, meter }` when the quota blocks the scan
 * so the caller can render the right 402 / skip.
 */
export async function createReceipt(
  userId: string,
  d: CreateReceiptInput,
  ipAddress?: string | null,
): Promise<CreateReceiptResult> {
  // Scan metering - the single choke-point (lib/billing/metering.ts) enforces
  // the monthly cap, consumes credits before overage, applies the tapered
  // overage rate and honours the spend cap. Do NOT add cap checks elsewhere.
  const meter = await meterScan(userId);
  if (!meter.allowed) return { ok: false, meter };

  const membership = await getUserCompany(userId);
  const receiptStatus: "pending" | "approved" = (await needsApproval(userId, membership))
    ? "pending"
    : "approved";

  // Safety net: if no category was supplied, suggest one from the vendor name
  // so receipts never silently land in "no category" for a known merchant.
  const basCode = d.basCode ?? suggestBasCode(d.vendorName) ?? undefined;
  const category = d.category ?? (basCode ? getBasAccount(basCode)?.name : undefined);

  const date =
    d.date == null ? undefined : d.date instanceof Date ? d.date : new Date(d.date);

  const [created] = await db
    .insert(receipts)
    .values({
      userId,
      companyId: membership?.companyId ?? null,
      imageUrl: d.imageUrl,
      receiptNumber: d.receiptNumber,
      vendorName: d.vendorName ?? undefined,
      date,
      totalAmount: d.totalAmount?.toFixed(2),
      vatAmount: d.vatAmount?.toFixed(2),
      vatRate: d.vatRate ?? undefined,
      category,
      basCode,
      aiConfidence: d.aiConfidence,
      receiptText: d.receiptText,
      status: receiptStatus,
    })
    .returning();

  await logAudit({
    userId,
    action: "receipt.create",
    details: `Receipt ${created.id} (${d.vendorName ?? "okänd"})`,
    ipAddress,
  });

  return { ok: true, receipt: created };
}
