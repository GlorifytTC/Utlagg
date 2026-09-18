import { NextResponse, type NextRequest } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { requireAccountant, requireCompanyAccess } from "@/lib/accountant";
import { logAuditEvent, clientIp } from "@/lib/audit";
import { resolveReceiptImageSrc } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * A single receipt for one client company, for the accountant.
 *
 * AUTHORIZATION — relationship-first, member-scoped:
 *   1. requireAccountant()
 *   2. requireCompanyAccess(accountantId, companyId) → active relationship +
 *      CURRENT member userIds (null ⇒ 404)
 *   3. the receipt is returned only if its userId is in the member set
 *
 * Returns 404 (not 403) when the receipt is outside the authorized member set,
 * so it never leaks whether that receipt exists. receipts.companyId is never
 * used for authorization.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; receiptId: string } },
) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const access = await requireCompanyAccess(acct.userId, params.id);
  if (!access) return NextResponse.json({ error: "Hittades inte" }, { status: 404 });

  const memberIds = access.memberIds;
  if (memberIds.length === 0) {
    return NextResponse.json({ error: "Hittades inte" }, { status: 404 });
  }

  const [receipt] = await db
    .select()
    .from(receipts)
    .where(
      and(
        eq(receipts.id, params.receiptId),
        // Ownership boundary: the receipt's owner must be a CURRENT member of
        // the authorized company. A receipt outside this set yields no row →
        // 404, indistinguishable from "does not exist".
        inArray(receipts.userId, memberIds),
      ),
    )
    .limit(1);

  if (!receipt) {
    return NextResponse.json({ error: "Hittades inte" }, { status: 404 });
  }

  // Resolve image server-side: the accountant is authorized but not the image owner,
  // so we sign using the receipt owner's userId.
  const imageSrc = await resolveReceiptImageSrc(receipt.imageUrl, receipt.userId);

  return NextResponse.json({ receipt, imageSrc });
}

/**
 * STRICT server-side allowlist for accountant edits. An accountant with an
 * ACTIVE relationship may edit ONLY these accounting/review fields. Every other
 * column (id, userId, companyId, imageUrl, receiptNumber, date, totalAmount,
 * status, approvedBy, aiConfidence, receiptText, fileHash, createdAt, Fortnox*)
 * is unreachable: it is neither in this schema nor in the .set().
 *
 * `reviewed` is a server-controlled ACTION, not a client field: the client
 * sends `reviewed: true|false`; the server derives reviewedBy from the
 * authenticated accountant and stamps reviewedAt. A browser cannot supply
 * reviewedBy/reviewedAt (they are rejected as unknown keys by .strict()).
 */
const editSchema = z
  .object({
    category: z.string().max(120).nullable().optional(),
    vatAmount: z.number().nonnegative().nullable().optional(),
    vatRate: z.union([z.literal(6), z.literal(12), z.literal(25)]).nullable().optional(),
    basCode: z.string().max(10).nullable().optional(),
    vendorName: z.string().max(300).nullable().optional(),
    note: z.string().max(2000).nullable().optional(),
    reviewed: z.boolean().optional(),
  })
  .strict();

type EditableRow = {
  category?: string | null;
  vatAmount?: string | null;
  vatRate?: number | null;
  basCode?: string | null;
  vendorName?: string | null;
  note?: string | null;
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
};

/**
 * PATCH — accountant edits / reviews a client's receipt.
 *
 * AUTHORIZATION (relationship-first, member-scoped, in order):
 *   1. requireAccountant()                       → 403 if not an accountant
 *   2. requireCompanyAccess(acct, [id])          → 404 if no ACTIVE relationship
 *   3. CURRENT companyMembers resolved (from #2)
 *   4. receipt scoped by inArray(userId, memberIds) → 404 if outside set
 *   5. update ONLY after authorization succeeds; WHERE re-asserts the scope
 *
 * receipts.companyId is never the boundary; a browser-supplied userId/reviewedBy
 * never affects anything. Pending/revoked relationships get no write access
 * (requireCompanyAccess only returns for status='active').
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; receiptId: string } },
) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const access = await requireCompanyAccess(acct.userId, params.id);
  if (!access) return NextResponse.json({ error: "Hittades inte" }, { status: 404 });
  if (access.memberIds.length === 0) {
    return NextResponse.json({ error: "Hittades inte" }, { status: 404 });
  }

  const parsed = editSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });
  }
  const d = parsed.data;

  const [current] = await db
    .select()
    .from(receipts)
    .where(and(eq(receipts.id, params.receiptId), inArray(receipts.userId, access.memberIds)))
    .limit(1);
  if (!current) return NextResponse.json({ error: "Hittades inte" }, { status: 404 });

  const updates: EditableRow = {};
  if ("category" in d) updates.category = d.category ?? null;
  if ("vatAmount" in d) updates.vatAmount = d.vatAmount == null ? null : d.vatAmount.toFixed(2);
  if ("vatRate" in d) updates.vatRate = d.vatRate ?? null;
  if ("basCode" in d) updates.basCode = d.basCode ?? null;
  if ("vendorName" in d) updates.vendorName = d.vendorName ?? null;
  if ("note" in d) updates.note = d.note ?? null;
  if (d.reviewed === true) {
    updates.reviewedAt = new Date();
    updates.reviewedBy = acct.userId; // server-derived reviewer — never from input
  } else if (d.reviewed === false) {
    updates.reviewedAt = null;
    updates.reviewedBy = null;
  }

  // Diff old→new for audit; skip no-op updates so no misleading event is written.
  const oldValues: Record<string, unknown> = {};
  const newValues: Record<string, unknown> = {};
  const cur = current as unknown as Record<string, unknown>;
  for (const [key, next] of Object.entries(updates)) {
    const prev = cur[key];
    const prevNorm = prev instanceof Date ? prev.toISOString() : prev ?? null;
    const nextNorm = next instanceof Date ? next.toISOString() : next ?? null;
    if (prevNorm !== nextNorm) {
      oldValues[key] = prevNorm;
      newValues[key] = nextNorm;
    }
  }

  if (Object.keys(newValues).length === 0) {
    return NextResponse.json({ receipt: current, changed: false });
  }

  const [updated] = await db
    .update(receipts)
    .set(updates)
    .where(and(eq(receipts.id, params.receiptId), inArray(receipts.userId, access.memberIds)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Hittades inte" }, { status: 404 });

  await logAuditEvent({
    userId: acct.userId,
    action: "accountant.receipt.update",
    entityType: "receipt",
    entityId: params.receiptId,
    oldValues,
    newValues,
    details: `company ${access.companyId}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ receipt: updated, changed: true });
}
