import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany, canManageCompany } from "@/lib/company";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  accountantDiscoverable: z.boolean().optional(),
  industry: z.string().max(80).nullable().optional(),
  discoveryDescription: z.string().max(1000).nullable().optional(),
});

/**
 * GET / PATCH the caller's company discovery profile.
 *
 * Company resolved from the session (never a browser companyId). PATCH is
 * owner/admin only. Only the three discovery fields are writable — the strict
 * schema rejects anything else, so this can't touch org/vat/name etc.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const membership = await getUserCompany(session.user.id);
  if (!membership) return NextResponse.json({ error: "Inget företag." }, { status: 404 });

  const [c] = await db
    .select({
      accountantDiscoverable: companies.accountantDiscoverable,
      industry: companies.industry,
      discoveryDescription: companies.discoveryDescription,
    })
    .from(companies)
    .where(eq(companies.id, membership.companyId))
    .limit(1);
  return NextResponse.json({ profile: c ?? null, canManage: canManageCompany(membership.role) });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const membership = await getUserCompany(session.user.id);
  if (!membership) return NextResponse.json({ error: "Inget företag." }, { status: 404 });
  if (!canManageCompany(membership.role)) {
    return NextResponse.json({ error: "Endast ägare/admin." }, { status: 403 });
  }

  const parsed = schema.strict().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if ("accountantDiscoverable" in parsed.data) updates.accountantDiscoverable = parsed.data.accountantDiscoverable;
  if ("industry" in parsed.data) updates.industry = parsed.data.industry ?? null;
  if ("discoveryDescription" in parsed.data) updates.discoveryDescription = parsed.data.discoveryDescription ?? null;
  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });

  await db.update(companies).set(updates).where(eq(companies.id, membership.companyId));

  await logAudit({
    userId: session.user.id,
    action: "company.discovery.update",
    details: `company ${membership.companyId}`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
