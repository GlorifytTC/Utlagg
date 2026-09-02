import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { companyInvites, companyMembers } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany } from "@/lib/company";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({ token: z.string().min(10) });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (await getUserCompany(session.user.id)) {
    return NextResponse.json({ error: "Du tillhör redan ett företag" }, { status: 409 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Ogiltig länk" }, { status: 400 });

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

  // Bind the invite to the address it was sent to — the link is a bearer token,
  // so this stops a leaked/forwarded link from being redeemed by a different
  // account than the one invited.
  if (invite.email && invite.email.toLowerCase() !== session.user.email?.toLowerCase()) {
    return NextResponse.json(
      { error: "Inbjudan är kopplad till en annan e-postadress." },
      { status: 403 },
    );
  }

  await db.insert(companyMembers).values({
    companyId: invite.companyId,
    userId: session.user.id,
    role: invite.role,
  });
  await db.update(companyInvites).set({ acceptedAt: new Date() }).where(eq(companyInvites.id, invite.id));
  await logAudit({ userId: session.user.id, action: "company.join", ipAddress: clientIp(req) });
  return NextResponse.json({ ok: true, companyId: invite.companyId });
}
