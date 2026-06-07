import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { approvalRequests, receipts } from "@/db/schema";
import { authOptions } from "@/lib/auth";
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
  if (reqRow.status !== "pending") {
    return NextResponse.json({ error: "Redan beslutad" }, { status: 409 });
  }

  await db
    .update(approvalRequests)
    .set({
      status: parsed.data.decision,
      approverComment: parsed.data.comment,
      decidedAt: new Date(),
    })
    .where(eq(approvalRequests.id, params.id));

  // Reflect an approved receipt's status.
  if (parsed.data.decision === "approved" && reqRow.receiptId) {
    await db.update(receipts).set({ status: "approved" }).where(eq(receipts.id, reqRow.receiptId));
  } else if (parsed.data.decision === "rejected" && reqRow.receiptId) {
    await db.update(receipts).set({ status: "rejected" }).where(eq(receipts.id, reqRow.receiptId));
  }

  await logAudit({
    userId: session.user.id,
    action: `approval.${parsed.data.decision}`,
    details: `request ${params.id}`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
