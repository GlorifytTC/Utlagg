import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { approvalRequests, receipts } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany } from "@/lib/company";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  decision: z.enum(["approved", "rejected"]),
  comment: z.string().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Ogiltigt beslut" }, { status: 400 });

  const email = (session.user.email ?? "").toLowerCase();
  const [reqRow] = await db
    .select()
    .from(approvalRequests)
    .where(and(eq(approvalRequests.id, params.id), eq(approvalRequests.approverEmail, email)))
    .limit(1);
  if (!reqRow) return NextResponse.json({ error: "Hittas inte" }, { status: 404 });
  if (reqRow.requesterId === session.user.id) {
    return NextResponse.json({ error: "Du kan inte attestera din egen begäran." }, { status: 403 });
  }
  if (reqRow.status !== "pending") {
    return NextResponse.json({ error: "Redan beslutad" }, { status: 409 });
  }

  // Re-derive CURRENT membership: approver must be in the requester's company
  // and still hold an approving role.
  const [approver, requester] = await Promise.all([
    getUserCompany(session.user.id),
    getUserCompany(reqRow.requesterId),
  ]);
  if (
    !approver ||
    !requester ||
    approver.companyId !== requester.companyId ||
    !["owner", "admin", "approver"].includes(approver.role)
  ) {
    return NextResponse.json({ error: "Saknar behörighet att attestera" }, { status: 403 });
  }
  const companyId = approver.companyId;

  await db
    .update(approvalRequests)
    .set({
      status: parsed.data.decision,
      approverComment: parsed.data.comment,
      decidedAt: new Date(),
    })
    .where(eq(approvalRequests.id, params.id));

  // Reflect an approved receipt's status.
  if (reqRow.receiptId) {
    await db
      .update(receipts)
      .set({ status: parsed.data.decision })
      .where(and(eq(receipts.id, reqRow.receiptId), eq(receipts.companyId, companyId)));
  }

  await logAudit({
    userId: session.user.id,
    action: `approval.${parsed.data.decision}`,
    details: `request ${params.id}`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
