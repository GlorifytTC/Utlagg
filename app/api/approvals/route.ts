import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { approvalRequests, receipts, mileageEntries } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { logAudit, clientIp } from "@/lib/audit";
import { requireFeature } from "@/lib/entitlements";
import { getUserCompany } from "@/lib/company";

export const runtime = "nodejs";

const schema = z
  .object({
    receiptId: z.string().uuid().optional(),
    mileageId: z.string().uuid().optional(),
    approverEmail: z.string().email(),
    requesterComment: z.string().max(1000).optional(),
  })
  .refine((d) => d.receiptId || d.mileageId, "Välj kvitto eller resa");

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const type = req.nextUrl.searchParams.get("type") ?? "incoming";

  const where =
    type === "outgoing"
      ? eq(approvalRequests.requesterId, session.user.id)
      : eq(approvalRequests.approverEmail, (session.user.email ?? "").toLowerCase());

  const rows = await db
    .select()
    .from(approvalRequests)
    .where(where)
    .orderBy(desc(approvalRequests.createdAt));
  return NextResponse.json({ requests: rows });
}

export async function POST(req: NextRequest) {
  const gate = await requireFeature("approvals");
  if (gate.status === 401) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (!gate.ok)
    return NextResponse.json(
      { error: "Attestflöden ingår i Företag-planen.", upgrade: true },
      { status: 403 },
    );
  const userId = gate.userId!;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ogiltiga fält" },
      { status: 400 },
    );
  }

  // Derive amount from the owned receipt or mileage entry.
  let amount = "0";
  if (parsed.data.receiptId) {
    const [r] = await db
      .select()
      .from(receipts)
      .where(and(eq(receipts.id, parsed.data.receiptId), eq(receipts.userId, userId)))
      .limit(1);
    if (!r) return NextResponse.json({ error: "Kvitto saknas" }, { status: 404 });
    amount = String(r.totalAmount ?? "0");
  } else if (parsed.data.mileageId) {
    const [m] = await db
      .select()
      .from(mileageEntries)
      .where(and(eq(mileageEntries.id, parsed.data.mileageId), eq(mileageEntries.userId, userId)))
      .limit(1);
    if (!m) return NextResponse.json({ error: "Resa saknas" }, { status: 404 });
    amount = String(m.amount);
  }

  // Owners, admins and approvers don't need anyone to approve them — the
  // request is recorded already-approved instead of sitting pending (which
  // would otherwise mean approving your own expense). Only 'member' employees
  // create a pending request for a manager.
  const membership = await getUserCompany(userId);
  const autoApprove = !membership || membership.role !== "member";

  const [created] = await db
    .insert(approvalRequests)
    .values({
      requesterId: userId,
      approverEmail: parsed.data.approverEmail.toLowerCase(),
      receiptId: parsed.data.receiptId,
      mileageId: parsed.data.mileageId,
      amount,
      requesterComment: parsed.data.requesterComment,
      status: autoApprove ? "approved" : "pending",
      approverComment: autoApprove ? "Auto-godkänd (ägare/administratör)" : undefined,
      decidedAt: autoApprove ? new Date() : undefined,
    })
    .returning();

  // Reflect an auto-approval on the receipt itself.
  if (autoApprove && parsed.data.receiptId) {
    await db
      .update(receipts)
      .set({ status: "approved" })
      .where(eq(receipts.id, parsed.data.receiptId));
  }

  await logAudit({
    userId,
    action: "approval.submit",
    details: `to ${parsed.data.approverEmail} · ${amount} kr`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ request: created }, { status: 201 });
}
