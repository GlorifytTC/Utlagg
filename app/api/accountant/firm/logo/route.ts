import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { accountingFirms } from "@/db/schema";
import { requireFirmRole, validateLogo } from "@/lib/accountant";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({ logoUrl: z.string().nullable() });

/**
 * PATCH the caller's firm logo (base64 data URL). Owner or admin only; the
 * firm id comes from the caller's own membership, never from input.
 */
export async function PATCH(req: NextRequest) {
  const m = await requireFirmRole("admin");
  if (!m) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });

  const check = validateLogo(parsed.data.logoUrl);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  await db.update(accountingFirms).set({ logoUrl: parsed.data.logoUrl }).where(eq(accountingFirms.id, m.firmId));
  await logAudit({
    userId: m.userId,
    action: parsed.data.logoUrl ? "firm.logo.update" : "firm.logo.remove",
    details: m.firmId,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
