import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { sendPasswordResetEmail } from "@/lib/email";
import { logAuditEvent, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
  if (!user) return NextResponse.json({ error: "Ej hittad" }, { status: 404 });

  const raw = crypto.randomBytes(32).toString("hex");
  await db
    .update(users)
    .set({
      passwordResetToken: crypto.createHash("sha256").update(raw).digest("hex"),
      passwordResetTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
    })
    .where(eq(users.id, user.id));
  await sendPasswordResetEmail(user.email, user.name ?? "Användare", raw);
  await logAuditEvent({
    userId: session.user!.id,
    action: "admin.user.send_reset",
    entityType: "user",
    entityId: params.id,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
