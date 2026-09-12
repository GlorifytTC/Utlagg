import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { accountantInvites } from "@/db/schema";
import { requireAccountant } from "@/lib/accountant";
import { sendAccountantInviteEmail } from "@/lib/email";
import { logAudit, clientIp } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email() });

/**
 * Accountant invites a BUSINESS by the email of someone who can consent for
 * it. Mirrors the company-invite security pattern exactly: 32-byte random
 * token, sha256 stored (raw token only in the email, never in DB or logs),
 * 7-day expiry, single-use (via acceptedAt on accept). Only an accountant may
 * call this. Duplicate live invites to the same email are prevented.
 */
export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, "accountant-invite");
  if (limited) return limited;

  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltig e-post" }, { status: 400 });
  const email = parsed.data.email.toLowerCase();

  // Don't stack multiple live (pending, unexpired) invites from this accountant
  // to the same email — return the existing one's state instead.
  const [existing] = await db
    .select({ id: accountantInvites.id })
    .from(accountantInvites)
    .where(
      and(
        eq(accountantInvites.accountantId, acct.userId),
        eq(accountantInvites.email, email),
        eq(accountantInvites.status, "pending"),
        isNull(accountantInvites.acceptedAt),
        gt(accountantInvites.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (existing) {
    return NextResponse.json(
      { ok: true, alreadyPending: true },
      { status: 200 },
    );
  }

  const raw = crypto.randomBytes(32).toString("hex");
  await db.insert(accountantInvites).values({
    accountantId: acct.userId,
    email,
    tokenHash: crypto.createHash("sha256").update(raw).digest("hex"),
    status: "pending",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await sendAccountantInviteEmail(email, raw);

  // Log the invite WITHOUT the raw token.
  await logAudit({
    userId: acct.userId,
    action: "accountant.invite",
    details: email,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
