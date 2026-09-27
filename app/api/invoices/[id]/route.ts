import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { customerInvoices } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany, canManageCompany } from "@/lib/company";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const membership = await getUserCompany(session.user.id);
  if (!membership) return NextResponse.json({ error: "Inget företag" }, { status: 403 });
  const [invoice] = await db
    .select()
    .from(customerInvoices)
    .where(and(eq(customerInvoices.id, params.id), eq(customerInvoices.companyId, membership.companyId)))
    .limit(1);
  if (!invoice) return NextResponse.json({ error: "Hittas inte" }, { status: 404 });
  return NextResponse.json({ invoice });
}

/**
 * Mark a customer invoice as paid / unpaid. Payment is what recognises the
 * income (kontantmetoden), so this is an owner/admin-only action and the
 * company scope always comes from the authenticated session, never the URL.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const membership = await getUserCompany(session.user.id);
  if (!membership) return NextResponse.json({ error: "Inget företag" }, { status: 403 });
  if (!canManageCompany(membership.role)) {
    return NextResponse.json({ error: "Behörighet saknas" }, { status: 403 });
  }

  let body: { paid?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig begäran" }, { status: 400 });
  }
  if (typeof body.paid !== "boolean") {
    return NextResponse.json({ error: "Ogiltig begäran" }, { status: 400 });
  }
  const paid = body.paid;

  const [invoice] = await db
    .select({ id: customerInvoices.id, invoiceNumber: customerInvoices.invoiceNumber })
    .from(customerInvoices)
    .where(and(eq(customerInvoices.id, params.id), eq(customerInvoices.companyId, membership.companyId)))
    .limit(1);
  if (!invoice) return NextResponse.json({ error: "Hittas inte" }, { status: 404 });

  const [updated] = await db
    .update(customerInvoices)
    .set({ status: paid ? "paid" : "sent" })
    .where(and(eq(customerInvoices.id, params.id), eq(customerInvoices.companyId, membership.companyId)))
    .returning();

  await logAudit({
    userId: session.user.id,
    action: paid ? "invoice.mark_paid" : "invoice.mark_unpaid",
    details: invoice.invoiceNumber,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ invoice: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const membership = await getUserCompany(session.user.id);
  if (!membership) return NextResponse.json({ error: "Inget företag" }, { status: 403 });

  const [invoice] = await db
    .select({ id: customerInvoices.id, invoiceNumber: customerInvoices.invoiceNumber })
    .from(customerInvoices)
    .where(and(eq(customerInvoices.id, params.id), eq(customerInvoices.companyId, membership.companyId)))
    .limit(1);
  if (!invoice) return NextResponse.json({ error: "Hittas inte" }, { status: 404 });

  await db
    .delete(customerInvoices)
    .where(and(eq(customerInvoices.id, params.id), eq(customerInvoices.companyId, membership.companyId)));

  await logAudit({
    userId: session.user.id,
    action: "invoice.delete",
    details: invoice.invoiceNumber,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
