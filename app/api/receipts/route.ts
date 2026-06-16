import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { receipts, users, companyMembers } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { logAudit, clientIp } from "@/lib/audit";
import { getUserCompany } from "@/lib/company";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(receipts)
    .where(eq(receipts.userId, session.user.id))
    .orderBy(desc(receipts.createdAt));

  return NextResponse.json({ receipts: rows });
}

const createSchema = z.object({
  imageUrl: z.string().optional(),
  receiptNumber: z.string().max(60).optional(),
  vendorName: z.string().optional(),
  date: z.string().datetime().optional(),
  totalAmount: z.number().nonnegative().optional(),
  vatAmount: z.number().nonnegative().optional(),
  vatRate: z.union([z.literal(6), z.literal(12), z.literal(25)]).optional(),
  category: z.string().optional(),
  basCode: z.string().optional(),
  aiConfidence: z.number().min(0).max(1).optional(),
  receiptText: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ogiltiga kvittouppgifter" },
        { status: 400 },
      );
    }

    // Enforce scan limit (scanLimit === -1 means unlimited).
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) {
      return NextResponse.json({ error: "Användare saknas" }, { status: 404 });
    }

    if (user.scanLimit !== -1 && user.scansUsedThisMonth >= user.scanLimit) {
      return NextResponse.json(
        {
          error:
            "Du har nått månadens gräns. Uppgradera för obegränsade skanningar.",
          code: "SCAN_LIMIT_REACHED",
        },
        { status: 402 },
      );
    }

    const d = parsed.data;
    const membership = await getUserCompany(userId);
    // Members need approval only if the company actually has an approver
    // (owner/admin/approver besides them). Otherwise auto-approve.
    let receiptStatus: "pending" | "approved" = "approved";
    if (membership && membership.role === "member") {
      const approvers = await db
        .select({ id: companyMembers.id })
        .from(companyMembers)
        .where(
          and(
            eq(companyMembers.companyId, membership.companyId),
            ne(companyMembers.userId, userId),
            inArray(companyMembers.role, ["owner", "admin", "approver"]),
          ),
        );
      if (approvers.length > 0) receiptStatus = "pending";
    }
    const [created] = await db
      .insert(receipts)
      .values({
        userId,
        companyId: membership?.companyId ?? null,
        imageUrl: d.imageUrl,
        receiptNumber: d.receiptNumber,
        vendorName: d.vendorName,
        date: d.date ? new Date(d.date) : undefined,
        totalAmount: d.totalAmount?.toFixed(2),
        vatAmount: d.vatAmount?.toFixed(2),
        vatRate: d.vatRate,
        category: d.category,
        basCode: d.basCode,
        aiConfidence: d.aiConfidence,
        receiptText: d.receiptText,
        // Only regular employees (member) need manager approval; owners,
        // admins, approvers and solo users (no company) are auto-approved.
        status: receiptStatus,
      })
      .returning();

    if (user.scanLimit !== -1) {
      await db
        .update(users)
        .set({ scansUsedThisMonth: user.scansUsedThisMonth + 1 })
        .where(eq(users.id, userId));
    }

    await logAudit({
      userId,
      action: "receipt.create",
      details: `Receipt ${created.id} (${d.vendorName ?? "okänd"})`,
      ipAddress: clientIp(req),
    });

    return NextResponse.json({ receipt: created }, { status: 201 });
  } catch (err) {
    console.error("receipt create error:", err);
    return NextResponse.json({ error: "Kunde inte spara kvittot" }, { status: 500 });
  }
}
