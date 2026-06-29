import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { customerInvoices } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany } from "@/lib/company";
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
