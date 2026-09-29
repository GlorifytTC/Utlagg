import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customerInvoices } from "@/db/schema";
import { requireAccountant, requireCompanyAccess } from "@/lib/accountant";
import { summarizeInvoiceIncome } from "@/lib/invoice-income";

export const runtime = "nodejs";

/**
 * Customer invoices (kundfakturor) for one client company, for the accountant.
 * Read-only.
 *
 * AUTHORIZATION: requireAccountant() → requireCompanyAccess() (active
 * relationship + worker assignment), then scope by customerInvoices.companyId.
 * Unlike receipts (member-owned, scoped by memberIds), invoices are owned by
 * the company itself and companyId is always set server-side from the creator's
 * membership, so companyId IS the correct boundary here.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const access = await requireCompanyAccess(acct.userId, params.id);
  if (!access) return NextResponse.json({ error: "Hittades inte" }, { status: 404 });

  const invoices = await db
    .select({
      id: customerInvoices.id,
      invoiceNumber: customerInvoices.invoiceNumber,
      buyerName: customerInvoices.buyerName,
      issueDate: customerInvoices.issueDate,
      dueDate: customerInvoices.dueDate,
      subtotal: customerInvoices.subtotal,
      vatTotal: customerInvoices.vatTotal,
      total: customerInvoices.total,
      currency: customerInvoices.currency,
      status: customerInvoices.status,
      reverseCharge: customerInvoices.reverseCharge,
    })
    .from(customerInvoices)
    .where(eq(customerInvoices.companyId, access.companyId))
    .orderBy(desc(customerInvoices.issueDate));

  return NextResponse.json({ invoices, summary: summarizeInvoiceIncome(invoices) });
}
