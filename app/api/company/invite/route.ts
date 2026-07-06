import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "node:crypto";
import { z } from "zod";
import { db } from "@/db";
import { companyInvites } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany, canManageCompany } from "@/lib/company";
import { sendCompanyInviteEmail } from "@/lib/email";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const membership = await getUserCompany(session.user.id);
  if (!membership || !canManageCompany(membership.role)) {
    return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Ogiltig e-post/roll" }, { status: 400 });

  const raw = crypto.randomBytes(32).toString("hex");
  await db.insert(companyInvites).values({
    companyId: membership.companyId,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    tokenHash: crypto.createHash("sha256").update(raw).digest("hex"),
    invitedBy: session.user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  await sendCompanyInviteEmail(parsed.data.email, raw);
  await logAudit({
    userId: session.user.id,
    action: "company.invite",
    details: `${parsed.data.email} (${parsed.data.role})`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
