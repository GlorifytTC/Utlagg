import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, accountingFirms, firmMembers, firmInvites } from "@/db/schema";
import { requireFirmMembership, requireFirmRole } from "@/lib/accountant";
import { sendFirmInviteEmail } from "@/lib/email";
import { logAudit, clientIp } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * GET — the caller's firm + its members. Any firm member may view the roster
 * (they work together); only owner/admin can mutate (other routes).
 */
export async function GET() {
  const m = await requireFirmMembership();
  if (!m) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const [firm] = await db
    .select({ id: accountingFirms.id, name: accountingFirms.name, ownerId: accountingFirms.ownerId })
    .from(accountingFirms)
    .where(eq(accountingFirms.id, m.firmId))
    .limit(1);

  const members = await db
    .select({
      userId: firmMembers.userId,
      name: users.name,
      email: users.email,
      role: firmMembers.role,
      joinedAt: firmMembers.createdAt,
    })
    .from(firmMembers)
    .innerJoin(users, eq(users.id, firmMembers.userId))
    .where(eq(firmMembers.firmId, m.firmId));

  const pendingInvites = await db
    .select({ id: firmInvites.id, email: firmInvites.email, role: firmInvites.role, createdAt: firmInvites.createdAt })
    .from(firmInvites)
    .where(and(eq(firmInvites.firmId, m.firmId), eq(firmInvites.status, "pending")));

  return NextResponse.json({
    firm,
    myRole: m.role,
    members,
    pendingInvites,
  });
}

const inviteSchema = z.object({
  email: z.string().email(),
  // Owner/admin may invite admins or workers. Nobody invites a second owner.
  role: z.enum(["admin", "member"]).default("member"),
});

/**
 * POST — invite a colleague into the firm (owner/admin only). Mirrors the
 * accountant-invite token pattern: 32-byte token, sha256 stored, 7-day expiry,
 * single-use. The invitee accepts via /firm/accept.
 */
export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, "firm-invite");
  if (limited) return limited;

  const m = await requireFirmRole("admin");
  if (!m) return NextResponse.json({ error: "Endast ägare/admin kan bjuda in." }, { status: 403 });

  const parsed = inviteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });
  const email = parsed.data.email.toLowerCase();

  // No stacked live invites to the same email in this firm.
  const [existing] = await db
    .select({ id: firmInvites.id })
    .from(firmInvites)
    .where(
      and(
        eq(firmInvites.firmId, m.firmId),
        eq(firmInvites.email, email),
        eq(firmInvites.status, "pending"),
        isNull(firmInvites.acceptedAt),
        gt(firmInvites.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (existing) return NextResponse.json({ ok: true, alreadyPending: true });

  const raw = crypto.randomBytes(32).toString("hex");
  await db.insert(firmInvites).values({
    firmId: m.firmId,
    email,
    tokenHash: crypto.createHash("sha256").update(raw).digest("hex"),
    role: parsed.data.role,
    status: "pending",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Reuse the accountant-invite email shell; link points to the firm accept.
  await sendFirmInviteEmail(email, raw).catch(() => {});

  await logAudit({
    userId: m.userId,
    action: "firm.invite",
    details: `firm ${m.firmId} invited ${email} as ${parsed.data.role}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
