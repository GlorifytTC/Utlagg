import { NextResponse, type NextRequest } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { getUserCompany, canManageCompany } from "@/lib/company";
import { requireFeature } from "@/lib/entitlements";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  decision: z.enum(["approve", "remove"]),
});

/**
 * Owner/admin decides on a pending receipt: "approve" moves it into the
 * dashboard (status → approved), "remove" rejects it. Server re-checks that
 * the caller is an owner/admin, the receipt belongs to their company, and
 * it's still pending — so a member can't approve their own bill and nobody
 * can act on another company's receipts.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireFeature("approvals");
  if (gate.status === 401) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (!gate.ok) {
    return NextResponse.json({ error: "Attestflöden ingår i Företag-planen." }, { status: 403 });
  }
  const userId = gate.userId!;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltigt beslut" }, { status: 400 });

  const membership = await getUserCompany(userId);
  if (!membership || !canManageCompany(membership.role)) {
    return NextResponse.json({ error: "Endast ägare/admin kan attestera" }, { status: 403 });
  }

  const [receipt] = await db
    .select({ id: receipts.id })
    .from(receipts)
    .where(
      and(
        eq(receipts.id, params.id),
        eq(receipts.companyId, membership.companyId),
        inArray(receipts.status, ["pending"]),
      ),
    )
    .limit(1);
  if (!receipt) {
    return NextResponse.json({ error: "Kvittot hittas inte eller är redan beslutat" }, { status: 404 });
  }

  const newStatus = parsed.data.decision === "approve" ? "approved" : "rejected";
  await db
    .update(receipts)
    .set({ status: newStatus, approvedBy: userId })
    .where(eq(receipts.id, params.id));

  await logAudit({
    userId,
    action: parsed.data.decision === "approve" ? "receipt.approve" : "receipt.reject",
    details: `receipt ${params.id}`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true, status: newStatus });
}
