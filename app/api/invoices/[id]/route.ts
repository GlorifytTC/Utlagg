import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { customerInvoices } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany } from "@/lib/company";

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
