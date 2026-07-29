import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { logAudit, clientIp } from "@/lib/audit";
import { deleteReceiptImageIfR2 } from "@/lib/storage";

export const runtime = "nodejs";

const updateSchema = z.object({
  vendorName: z.string().optional(),
  date: z.string().datetime().optional(),
  totalAmount: z.number().nonnegative().optional(),
  vatAmount: z.number().nonnegative().optional(),
  vatRate: z.union([z.literal(6), z.literal(12), z.literal(25)]).optional(),
  category: z.string().optional(),
  basCode: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  try {
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });
    }
    const d = parsed.data;

    const [updated] = await db
      .update(receipts)
      .set({
        vendorName: d.vendorName,
        date: d.date ? new Date(d.date) : undefined,
        totalAmount: d.totalAmount?.toFixed(2),
        vatAmount: d.vatAmount?.toFixed(2),
        vatRate: d.vatRate,
        category: d.category,
        basCode: d.basCode,
        status: d.status,
      })
      // ownership enforced in WHERE so users can't edit others' receipts
      .where(
        and(eq(receipts.id, params.id), eq(receipts.userId, session.user.id)),
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Kvitto hittades inte" }, { status: 404 });
    }

    await logAudit({
      userId: session.user.id,
      action: "receipt.update",
      details: `Receipt ${params.id} updated`,
      ipAddress: clientIp(req),
    });

    return NextResponse.json({ receipt: updated });
  } catch (err) {
    console.error("receipt update error:", err);
    return NextResponse.json({ error: "Kunde inte uppdatera" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  // NOTE: Bokföringslagen requires receipts (verifikationer) to be retained
  // for 7 years. In production prefer a soft-delete / archive flag over a hard
  // delete. This endpoint is wired for completeness.
  const [deleted] = await db
    .delete(receipts)
    .where(and(eq(receipts.id, params.id), eq(receipts.userId, session.user.id)))
    .returning({ id: receipts.id, imageUrl: receipts.imageUrl });

  if (!deleted) {
    return NextResponse.json({ error: "Kvitto hittades inte" }, { status: 404 });
  }

  // The row is gone — its R2 image object would otherwise be orphaned. Best-
  // effort cleanup (no-ops for inline data-URL / external images).
  await deleteReceiptImageIfR2(deleted.imageUrl);

  await logAudit({
    userId: session.user.id,
    action: "receipt.delete",
    details: `Receipt ${params.id} deleted`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
