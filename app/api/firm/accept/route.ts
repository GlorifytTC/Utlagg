import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, firmInvites, firmMembers } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserFirm } from "@/lib/accountant";
import { logAudit, clientIp } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({ token: z.string().min(10) });

/**
 * POST — a signed-in accountant accepts a firm invitation.
 *
 * Security: authenticated + invite exists + token hash matches + pending + not
 * expired + invited email === the caller's email (case-insensitive). The
 * invitee is also marked isAccountant (they now work as one). Guards:
 *   - the caller must not already belong to another firm (one firm per user).
 *   - single-use via acceptedAt; unique (firm,user) prevents double-join.
 */
export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, "firm-accept");
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltig länk" }, { status: 400 });

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
  if (!invite) {
    return NextResponse.json({ error: "Länken är ogiltig eller har gått ut" }, { status: 400 });
  }

  // Email binding.
  if (invite.email && invite.email.toLowerCase() !== session.user.email?.toLowerCase()) {
    return NextResponse.json({ error: "Inbjudan är kopplad till en annan e-postadress." }, { status: 403 });
  }

  // One firm per user.
  const existingFirm = await getUserFirm(session.user.id);
  if (existingFirm) {
    if (existingFirm.firmId === invite.firmId) {
      // Already a member — treat as success (idempotent).
      await db
        .update(firmInvites)
        .set({ status: "active", acceptedAt: new Date(), acceptedBy: session.user.id })
        .where(eq(firmInvites.id, invite.id));
      return NextResponse.json({ ok: true, firmId: invite.firmId });
    }
    return NextResponse.json(
      { error: "Du tillhör redan en annan byrå." },
      { status: 409 },
    );
  }

  // Add membership (they now act as an accountant).
  await db.insert(firmMembers).values({
    firmId: invite.firmId,
    userId: session.user.id,
    role: invite.role,
  });
  await db.update(users).set({ isAccountant: true }).where(eq(users.id, session.user.id));

  await db
    .update(firmInvites)
    .set({ status: "active", acceptedAt: new Date(), acceptedBy: session.user.id })
    .where(eq(firmInvites.id, invite.id));

  await logAudit({
    userId: session.user.id,
    action: "firm.accept",
    details: `joined firm ${invite.firmId} as ${invite.role}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true, firmId: invite.firmId });
}
