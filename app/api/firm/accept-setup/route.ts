import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, firmInvites, firmMembers } from "@/db/schema";
import { logAudit, clientIp } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Lösenordet måste vara minst 8 tecken"),
});

/**
 * GET ?token= — validate a firm invite token and return the invitee's email +
 * name so the set-password page can greet them. Does NOT require a session.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (token.length < 10) return NextResponse.json({ valid: false }, { status: 400 });
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const [invite] = await db
    .select({ email: firmInvites.email, name: firmInvites.inviteeName })
    .from(firmInvites)
    .where(
      and(
        eq(firmInvites.tokenHash, tokenHash),
        eq(firmInvites.status, "pending"),
        isNull(firmInvites.acceptedAt),
        gt(firmInvites.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!invite) return NextResponse.json({ valid: false }, { status: 400 });
  return NextResponse.json({ valid: true, email: invite.email, name: invite.name });
}

/**
 * POST — the invitee sets their password and joins the firm, WITHOUT any prior
 * login (the invite token proves email ownership). Flow:
 *   1. validate token (pending, unexpired)
 *   2. find the pre-created user by the invite email
 *   3. set their password (only if not already set, so this can't hijack an
 *      existing account that already has a password)
 *   4. add firm membership (idempotent), mark isAccountant
 *   5. mark the invite accepted (single-use)
 * After this they can log in normally with email + the password they chose.
 */
export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, "firm-accept-setup");
  if (limited) return limited;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter" }, { status: 400 });
  }

  const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const [invite] = await db
    .select()
    .from(firmInvites)
    .where(
      and(
        eq(firmInvites.tokenHash, tokenHash),
        eq(firmInvites.status, "pending"),
        isNull(firmInvites.acceptedAt),
        gt(firmInvites.expiresAt, new Date()),
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

  // Only set the password if the account has none yet. If it already has one,
  // this invite must not overwrite it (that account belongs to a real person
  // who set it) — they should just log in and accept via the session flow.
  if (!user.hashedPassword) {
    const hashed = await bcrypt.hash(parsed.data.password, 12);
    await db.update(users).set({ hashedPassword: hashed, isAccountant: true }).where(eq(users.id, user.id));
  } else {
    await db.update(users).set({ isAccountant: true }).where(eq(users.id, user.id));
  }

  // Add firm membership (idempotent via unique (firm,user)).
  const [existingMember] = await db
    .select({ id: firmMembers.id })
    .from(firmMembers)
    .where(and(eq(firmMembers.firmId, invite.firmId), eq(firmMembers.userId, user.id)))
    .limit(1);
  if (!existingMember) {
    await db.insert(firmMembers).values({
      firmId: invite.firmId,
      userId: user.id,
      role: invite.role,
    });
  }

  await db
    .update(firmInvites)
    .set({ status: "active", acceptedAt: new Date(), acceptedBy: user.id })
    .where(eq(firmInvites.id, invite.id));

  await logAudit({
    userId: user.id,
    action: "firm.accept.setup",
    details: `joined firm ${invite.firmId} as ${invite.role} via set-password`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true, email: invite.email });
}
