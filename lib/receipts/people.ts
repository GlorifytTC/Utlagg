import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { receiptReviews, users } from "@/db/schema";

export type Person = { name: string; logoUrl: string | null };
export type ReceiptPeople = { approver: Person | null; reviewers: Person[] };

/**
 * Who stands behind each receipt: the owner/admin/accountant who approved it
 * (`receipts.approvedBy`) and every accountant who reviewed it, oldest first.
 * Drives the avatar bubbles that replace the plain "Approved" text.
 */
export async function loadReceiptPeople(
  rows: { id: string; userId: string; status: string; approvedBy: string | null }[],
): Promise<Map<string, ReceiptPeople>> {
  const out = new Map<string, ReceiptPeople>();
  for (const r of rows) out.set(r.id, { approver: null, reviewers: [] });
  if (rows.length === 0) return out;

  const ids = rows.map((r) => r.id);
  // Approved with no recorded approver = self-approved by the uploader (older rows).
  const approverOf = (r: (typeof rows)[number]) => r.approvedBy ?? (r.status === "approved" ? r.userId : null);
  const approverIds = Array.from(new Set(rows.map(approverOf).filter((x): x is string => !!x)));

  const [reviewRows, approverRows] = await Promise.all([
    db
      .select({
        receiptId: receiptReviews.receiptId,
        name: users.name,
        email: users.email,
        logoUrl: users.logoUrl,
      })
      .from(receiptReviews)
      .innerJoin(users, eq(users.id, receiptReviews.accountantId))
      .where(inArray(receiptReviews.receiptId, ids))
      .orderBy(asc(receiptReviews.reviewedAt)),
    approverIds.length
      ? db
          .select({ id: users.id, name: users.name, email: users.email, logoUrl: users.logoUrl })
          .from(users)
          .where(inArray(users.id, approverIds))
      : Promise.resolve([] as { id: string; name: string | null; email: string; logoUrl: string | null }[]),
  ]);

  const approverById = new Map<string, Person>(
    approverRows.map((u: { id: string; name: string | null; email: string; logoUrl: string | null }) => [
      u.id,
      { name: u.name ?? u.email, logoUrl: u.logoUrl },
    ]),
  );
  for (const r of rows) {
    const id = approverOf(r);
    if (id) out.get(r.id)!.approver = approverById.get(id) ?? null;
  }
  for (const v of reviewRows) {
    out.get(v.receiptId)?.reviewers.push({ name: v.name ?? v.email, logoUrl: v.logoUrl });
  }
  return out;
}
