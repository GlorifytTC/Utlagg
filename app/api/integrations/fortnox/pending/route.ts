import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { requireFeature } from "@/lib/entitlements";

export const runtime = "nodejs";

/**
 * Lists receipts that COULD be sent to Fortnox but haven't been yet, so the
 * person can pick exactly which ones to sync instead of an unreviewed
 * "send everything" button. Only approved receipts are offered — pending
 * or rejected expenses have no business reaching bookkeeping yet.
 */
export async function GET() {
  const gate = await requireFeature("fortnox");
  if (gate.status === 401) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (!gate.ok) return NextResponse.json({ error: "Fortnox ingår i Pro-planen." }, { status: 403 });

  const rows = await db
    .select({
      id: receipts.id,
      date: receipts.date,
      vendorName: receipts.vendorName,
      totalAmount: receipts.totalAmount,
      vatAmount: receipts.vatAmount,
      category: receipts.category,
      basCode: receipts.basCode,
      status: receipts.status,
    })
    .from(receipts)
    .where(
      and(
        eq(receipts.userId, gate.userId!),
        eq(receipts.fortnoxSynced, false),
        eq(receipts.status, "approved"),
      ),
    )
    .orderBy(desc(receipts.date));

  return NextResponse.json({ receipts: rows });
}
