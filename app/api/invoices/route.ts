import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { customerInvoices, companies } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { requireFeature } from "@/lib/entitlements";
import { getUserCompany } from "@/lib/company";
import { computeInvoiceTotals } from "@/lib/invoice";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const lineSchema = z.object({
  description: z.string().trim().min(1).max(300),
  quantity: z.number().positive(),
  unitPrice: z.number(),
  vatRate: z.number().min(0).max(25),
});

const schema = z.object({
  invoiceNumber: z.string().trim().max(40).optional(),
  buyerName: z.string().trim().min(1).max(255),
  buyerOrgNumber: z.string().trim().max(20).optional(),
  buyerVatNumber: z.string().trim().max(50).optional(),
  buyerAddress: z.string().max(500).optional(),
  issueDate: z.string().refine((s) => !Number.isNaN(Date.parse(s))),
  dueDate: z.string().optional(),
  reverseCharge: z.boolean().default(false),
  lineItems: z.array(lineSchema).min(1),
  note: z.string().max(1000).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const membership = await getUserCompany(session.user.id);
  if (!membership) return NextResponse.json({ invoices: [] });
  const rows = await db
    .select()
    .from(customerInvoices)
    .where(eq(customerInvoices.companyId, membership.companyId))
    .orderBy(desc(customerInvoices.issueDate));
  return NextResponse.json({ invoices: rows });
}

export async function POST(req: NextRequest) {
  const gate = await requireFeature("invoicing");
  if (gate.status === 401) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (!gate.ok)
    return NextResponse.json(
      { error: "Fakturering ingår i Pro-planen.", upgrade: true },
      { status: 403 },
    );

  const membership = await getUserCompany(gate.userId!);
  if (!membership) {
    return NextResponse.json(
      { error: "Skapa ett företag först — säljaruppgifterna hämtas därifrån." },
      { status: 409 },
    );
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ogiltiga fält" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const [company] = await db.select().from(companies).where(eq(companies.id, membership.companyId)).limit(1);
  if (!company) return NextResponse.json({ error: "Företag saknas" }, { status: 404 });

  const totals = computeInvoiceTotals(d.lineItems, d.reverseCharge);

  // Invoice number is optional — auto-generate a per-company sequential number
  // (YYYY-NNNN) when the user leaves it blank.
  let invoiceNumber = d.invoiceNumber?.trim();
  if (!invoiceNumber) {
    const [{ count }] = (await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customerInvoices)
      .where(eq(customerInvoices.companyId, company.id))) as { count: number }[];
    invoiceNumber = `${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(4, "0")}`;
  }

  const [created] = await db
    .insert(customerInvoices)
    .values({
      companyId: company.id,
      createdById: gate.userId!,
      invoiceNumber,
      sellerName: company.name,
      sellerOrgNumber: company.orgNumber,
      sellerVatNumber: company.vatNumber,
      sellerAddress: [company.address, company.postalCode, company.city].filter(Boolean).join(", ") || null,
      buyerName: d.buyerName,
      buyerOrgNumber: d.buyerOrgNumber,
      buyerVatNumber: d.buyerVatNumber,
      buyerAddress: d.buyerAddress,
      issueDate: new Date(d.issueDate),
      dueDate: d.dueDate && !Number.isNaN(Date.parse(d.dueDate)) ? new Date(d.dueDate) : null,
      reverseCharge: d.reverseCharge,
      lineItems: d.lineItems,
      subtotal: totals.subtotal.toFixed(2),
      vatTotal: totals.vatTotal.toFixed(2),
      total: totals.total.toFixed(2),
      note: d.note,
    })
    .returning();

  await logAudit({
    userId: gate.userId!,
    action: "invoice.create",
    details: `${d.invoiceNumber} · ${totals.total} kr`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ invoice: created }, { status: 201 });
}
