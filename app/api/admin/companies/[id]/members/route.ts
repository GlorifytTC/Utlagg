import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, companies, companyMembers, companyInvites } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { sendCompanyInviteEmail } from "@/lib/email";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email().max(320),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  // Platform admins can add admins and workers. Owner is never assigned here.
  role: z.enum(["admin", "member"]).default("member"),
});

/**
 * POST - platform admin adds an admin or worker to a company.
 *
 *  - Existing account, not in any company  -> added to this company directly.
 *  - New email                              -> account pre-created (no
 *    password) + set-password invite email; they join with this role when
 *    they accept, through the same flow as a normal company invite.
 *  - Already in this company                -> 409.
 *  - Already in ANOTHER company             -> 409 (one company per user).
 *
 * requireAdmin() is the gate. Seat limits are intentionally not enforced:
 * this is the operator acting manually (e.g. for enterprise customers), and
 * every add is audit-logged with the admin's id.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ange förnamn, efternamn och en giltig e-post." }, { status: 400 });
  const { role } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();
  const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();

  const [company] = await db
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .where(eq(companies.id, params.id))
    .limit(1);
  if (!company) return NextResponse.json({ error: "Företaget hittades inte." }, { status: 404 });

  const [user] = await db
    .select({ id: users.id, name: users.name, isAccountant: users.isAccountant })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user) {
    if (user.isAccountant) {
      return NextResponse.json(
        { error: "Kontot är ett revisorskonto och kan inte bli medlem i ett företag." },
        { status: 409 },
      );
    }
    const [existing] = await db
      .select({ companyId: companyMembers.companyId })
      .from(companyMembers)
      .where(eq(companyMembers.userId, user.id))
      .limit(1);
    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.companyId === company.id
              ? "Användaren är redan medlem i företaget."
              : "Användaren tillhör redan ett annat företag.",
        },
        { status: 409 },
      );
    }

    await db.insert(companyMembers).values({ companyId: company.id, userId: user.id, role });
    if (!user.name) await db.update(users).set({ name: fullName }).where(eq(users.id, user.id));

    await logAudit({
      userId: session.user.id,
      action: "admin.company.add_member",
      details: `${email} -> ${company.name} (${role}), direct`,
      ipAddress: clientIp(req),
    });
    return NextResponse.json({ ok: true, status: "added" });
  }

  // New person: pre-create the account and send the set-password invite.
  await db.insert(users).values({
    email,
    name: fullName,
    hashedPassword: null,
    scanLimit: 25,
    subscriptionTier: "free",
  });
  const raw = crypto.randomBytes(32).toString("hex");
  await db.insert(companyInvites).values({
    companyId: company.id,
    email,
    inviteeName: fullName,
    role,
    tokenHash: crypto.createHash("sha256").update(raw).digest("hex"),
    invitedBy: session.user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  await sendCompanyInviteEmail(email, raw);

  await logAudit({
    userId: session.user.id,
    action: "admin.company.add_member",
    details: `${email} -> ${company.name} (${role}), invited`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true, status: "invited" });
}
