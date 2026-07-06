import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { receipts, users } from "@/db/schema";
import { getUserCompany, canManageCompany } from "@/lib/company";
import { requireFeature } from "@/lib/entitlements";

export const runtime = "nodejs";

/**
 * Lists receipts awaiting approval for the current owner/admin — every
 * receipt a MEMBER uploaded that's still `status = "pending"` in this
 * company. This is the "Awaiting your approval" inbox. Owners and admins
 * only; members get an empty list (they don't approve anyone).
 */
export async function GET(_req: NextRequest) {
  const gate = await requireFeature("approvals");
  if (gate.status === 401) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Attestflöden ingår i Företag-planen.", upgrade: true },
      { status: 403 },
    );
  }
  const userId = gate.userId!;

  const membership = await getUserCompany(userId);
  if (!membership || !canManageCompany(membership.role)) {
    return NextResponse.json({ pending: [] });
  }

  const rows = await db
    .select({
      id: receipts.id,
      vendorName: receipts.vendorName,
      totalAmount: receipts.totalAmount,
      vatAmount: receipts.vatAmount,
      vatRate: receipts.vatRate,
      date: receipts.date,
      category: receipts.category,
      imageUrl: receipts.imageUrl,
      receiptNumber: receipts.receiptNumber,
      createdAt: receipts.createdAt,
      uploaderName: users.name,
      uploaderEmail: users.email,
    })
    .from(receipts)
    .innerJoin(users, eq(receipts.userId, users.id))
    .where(and(eq(receipts.companyId, membership.companyId), eq(receipts.status, "pending")))
    .orderBy(desc(receipts.createdAt));

  return NextResponse.json({ pending: rows });
}
