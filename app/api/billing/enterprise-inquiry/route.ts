import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminEmails } from "@/lib/admin";
import { sendEnterpriseInquiry } from "@/lib/email";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

/** A signed-in user requests an Enterprise quote. Emails the owner (ADMIN_EMAILS). */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  let note: string | undefined;
  try {
    note = (await req.json())?.note;
  } catch {
    /* no body */
  }

  const owner = adminEmails()[0];
  if (owner) await sendEnterpriseInquiry(owner, session.user.email, note);

  await logAudit({
    userId: session.user.id,
    action: "billing.enterprise_inquiry",
    details: session.user.email,
    ipAddress: clientIp(req),
  });
  // Always succeed for the user even if email isn't configured (we logged it).
  return NextResponse.json({ ok: true });
}
