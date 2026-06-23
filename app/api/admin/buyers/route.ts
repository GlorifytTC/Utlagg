import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq, sql } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { customerInvoices } from "@/db/schema";
import { getUserCompany } from "@/lib/company";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getUserCompany(session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const buyers = await db
    .selectDistinctOn([customerInvoices.buyerName, customerInvoices.buyerOrgNumber], {
      name: customerInvoices.buyerName,
      orgNumber: customerInvoices.buyerOrgNumber,
      vatNumber: customerInvoices.buyerVatNumber,
      address: customerInvoices.buyerAddress,
    })
    .from(customerInvoices)
    .where(
      and(
        eq(customerInvoices.companyId, membership.companyId),
        q
          ? sql`LOWER(${customerInvoices.buyerName}) LIKE ${"%" + q.toLowerCase() + "%"}`
          : undefined
      )
    )
    .limit(20);

  return NextResponse.json({ buyers });
}