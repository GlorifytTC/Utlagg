import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, companyInvites } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany, canManageCompany } from "@/lib/company";
import { sendCompanyInviteEmail } from "@/lib/email";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
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
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  const fullName = `${parsed.data.firstName.trim()} ${parsed.data.lastName.trim()}`.trim();

  // Pre-create the account (no password) so the invitee gets one directly
  // without self-registration. Reuse an existing user; only fill a missing name.
  const [existingUser] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existingUser) {
    if (!existingUser.name) {
      await db.update(users).set({ name: fullName }).where(eq(users.id, existingUser.id));
    }
  } else {
    await db.insert(users).values({
      email,
      name: fullName,
      hashedPassword: null, // set by the invitee via the set-password link
      scanLimit: 25,
      subscriptionTier: "free",
    });
  }

  const raw = crypto.randomBytes(32).toString("hex");
  await db.insert(companyInvites).values({
    companyId: membership.companyId,
    email,
    inviteeName: fullName,
    role: parsed.data.role,
    tokenHash: crypto.createHash("sha256").update(raw).digest("hex"),
    invitedBy: session.user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  await sendCompanyInviteEmail(email, raw);
  await logAudit({
    userId: session.user.id,
    action: "company.invite",
    details: `${email} (${parsed.data.role})`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
