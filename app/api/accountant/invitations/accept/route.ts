import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { accountantInvites, accountantClients } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany } from "@/lib/company";
import { getUserFirm } from "@/lib/accountant";
import { logAudit, clientIp } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({ token: z.string().min(10) });

/**
 * The CLIENT (a signed-in business user) accepts an accountant invitation.
 *
 * Security: authenticated + invite exists + token hash matches + pending +
 * not expired + invited email === the caller's email (case-insensitive). The
 * link is a bearer token, so the email binding stops a forwarded/leaked link
 * being redeemed by a different account.
 *
 * Company binding: the accountant connects to the client's COMPANY. If the
 * client has no company we do NOT silently create one — we return 409 with
 * needsCompany:true so the UI can route them through the existing
 * POST /api/company flow and retry. On success the accountantClients row is
 * activated (idempotent: a retry that finds it already active just succeeds).
 */
export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, "accountant-accept");
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltig länk" }, { status: 400 });

  const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const [invite] = await db
    .select()
    .from(accountantInvites)
    .where(
      and(
        eq(accountantInvites.tokenHash, tokenHash),
        eq(accountantInvites.status, "pending"),
        isNull(accountantInvites.acceptedAt),
        gt(accountantInvites.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!invite) {
    return NextResponse.json({ error: "Länken är ogiltig eller har gått ut" }, { status: 400 });
  }

  // Email binding — the invite is tied to the address it was sent to.
  if (invite.email && invite.email.toLowerCase() !== session.user.email?.toLowerCase()) {
    return NextResponse.json(
      { error: "Inbjudan är kopplad till en annan e-postadress." },
      { status: 403 },
    );
  }

  // The client must have a company for the relationship to bind to. If not,
  // tell the UI to create one first — never auto-create silently.
  const membership = await getUserCompany(session.user.id);
  if (!membership) {
    return NextResponse.json(
      {
        error: "Du behöver skapa ett företag först.",
        needsCompany: true,
        // The UI creates a company via POST /api/company, then retries accept
        // with the same token.
        createCompanyEndpoint: "/api/company",
      },
      { status: 409 },
    );
  }
  const companyId = membership.companyId;

  // Activate (or upsert) the relationship, respecting the unique
  // (accountantId, companyId) constraint. A prior revoked row flips back to
  // active; an already-active row is left as-is (idempotent retry).
  const [existingRel] = await db
    .select({ id: accountantClients.id, status: accountantClients.status })
    .from(accountantClients)
    .where(
      and(
        eq(accountantClients.accountantId, invite.accountantId),
        eq(accountantClients.companyId, companyId),
      ),
    )
    .limit(1);

  if (existingRel) {
    if (existingRel.status !== "active") {
      await db
        .update(accountantClients)
        .set({ status: "active", activatedAt: new Date(), revokedAt: null, revokedBy: null })
        .where(eq(accountantClients.id, existingRel.id));
    }
  } else {
    const firm = await getUserFirm(invite.accountantId);
    await db.insert(accountantClients).values({
      accountantId: invite.accountantId,
      firmId: firm?.firmId ?? null,
      companyId,
      status: "active",
      activatedAt: new Date(),
    });
  }

  // Mark the invite accepted (single-use) and record who/where.
  await db
    .update(accountantInvites)
    .set({
      status: "active",
      acceptedAt: new Date(),
      acceptedBy: session.user.id,
      companyId,
    })
    .where(eq(accountantInvites.id, invite.id));

  await logAudit({
    userId: session.user.id,
    action: "accountant.accept",
    details: `company ${companyId}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true, companyId });
}
