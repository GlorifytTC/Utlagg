import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { accountingFirms } from "@/db/schema";
import { requireFirmRole, validateLogo } from "@/lib/accountant";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    logoUrl: z.string().nullable().optional(),
  })
  .refine((v) => v.name !== undefined || v.logoUrl !== undefined);

/**
 * PATCH the caller's firm: rename and/or set the logo (base64 data URL).
 * Owner or admin only; the firm id comes from the caller's own membership,
 * never from input.
 */
export async function PATCH(req: NextRequest) {
  const m = await requireFirmRole("admin");
  if (!m) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });
  const { name, logoUrl } = parsed.data;

  if (logoUrl !== undefined) {
    const check = validateLogo(logoUrl);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
  }

  await db
    .update(accountingFirms)
    .set({ ...(name !== undefined && { name }), ...(logoUrl !== undefined && { logoUrl }) })
    .where(eq(accountingFirms.id, m.firmId));
  await logAudit({
    userId: m.userId,
    action: name !== undefined ? "firm.rename" : logoUrl ? "firm.logo.update" : "firm.logo.remove",
    details: m.firmId,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
