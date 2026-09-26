import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, companyInvites, companyMembers } from "@/db/schema";
import { getUserCompany } from "@/lib/company";
import { logAudit, clientIp } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Lösenordet måste vara minst 8 tecken"),
});

/**
 * GET ?token= — validate a company invite and return email + name for the
 * set-password page. No session required.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (token.length < 10) return NextResponse.json({ valid: false }, { status: 400 });
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const [invite] = await db
    .select({ email: companyInvites.email, name: companyInvites.inviteeName })
    .from(companyInvites)
    .where(
      and(
        eq(companyInvites.tokenHash, tokenHash),
        isNull(companyInvites.acceptedAt),
        gt(companyInvites.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!invite) return NextResponse.json({ valid: false }, { status: 400 });
  return NextResponse.json({ valid: true, email: invite.email, name: invite.name });
}

/**
 * POST — the invitee sets their password and joins the company, WITHOUT prior
 * login (the token proves email ownership). Sets the password only if the
 * account has none yet (can't hijack an account that already has one). Adds
 * company membership (idempotent) and marks the invite accepted.
 */
export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, "company-accept-setup");
  if (limited) return limited;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter" }, { status: 400 });
  }

  const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const [invite] = await db
    .select()
    .from(companyInvites)
    .where(
      and(
        eq(companyInvites.tokenHash, tokenHash),
        isNull(companyInvites.acceptedAt),
        gt(companyInvites.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!invite) return NextResponse.json({ error: "Länken är ogiltig eller har gått ut" }, { status: 400 });

  const [user] = await db
    .select({ id: users.id, hashedPassword: users.hashedPassword })
    .from(users)
    .where(eq(users.email, invite.email))
    .limit(1);
  if (!user) return NextResponse.json({ error: "Kontot hittades inte." }, { status: 400 });

  if (!user.hashedPassword) {
    const hashed = await bcrypt.hash(parsed.data.password, 12);
    await db.update(users).set({ hashedPassword: hashed }).where(eq(users.id, user.id));
  }

  // Add company membership if the user isn't already in a company.
  const existingCompany = await getUserCompany(user.id);
  if (!existingCompany) {
    await db.insert(companyMembers).values({
      companyId: invite.companyId,
      userId: user.id,
      role: invite.role,
    });
  }

  await db.update(companyInvites).set({ acceptedAt: new Date() }).where(eq(companyInvites.id, invite.id));

  await logAudit({
    userId: user.id,
    action: "company.join.setup",
    details: `joined company ${invite.companyId} as ${invite.role} via set-password`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true, email: invite.email });
}
