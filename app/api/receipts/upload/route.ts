import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import {
  isStorageConfigured,
  uploadReceiptImage,
  getSignedReceiptUrl,
} from "@/lib/storage";
import { logAuditEvent, clientIp } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 30;

const schema = z.object({
  image: z.string().min(1), // base64 or data URL
  receiptId: z.string().uuid().optional(),
});

/**
 * Persist a receipt image to R2. Additive to the existing flow:
 *   1. client uploads here -> gets { key }
 *   2. client saves the receipt via POST /api/receipts with imageUrl = key
 * If a receiptId is supplied and owned by the user, we also patch its imageUrl.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Bildlagring är inte konfigurerad (R2)." },
      { status: 503 },
    );
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Bild saknas" }, { status: 400 });
  }

  const userId = session.user.id;
  // Use the provided receipt id, or a placeholder filename for pre-save uploads.
  const fileId = parsed.data.receiptId ?? crypto.randomUUID();

  try {
    const { key } = await uploadReceiptImage(userId, fileId, parsed.data.image);

    // Tamper-evidence: hash the raw image bytes (strip any data-URL prefix).
    const b64 = parsed.data.image.includes(",")
      ? parsed.data.image.slice(parsed.data.image.indexOf(",") + 1)
      : parsed.data.image;
    const fileHash = crypto
      .createHash("sha256")
      .update(Buffer.from(b64, "base64"))
      .digest("hex");

    if (parsed.data.receiptId) {
      await db
        .update(receipts)
        .set({ imageUrl: key, fileHash })
        .where(
          and(
            eq(receipts.id, parsed.data.receiptId),
            eq(receipts.userId, userId),
          ),
        );
    }

    await logAuditEvent({
      userId,
      action: "receipt.image.upload",
      entityType: "receipt",
      entityId: parsed.data.receiptId,
      ipAddress: clientIp(req),
      userAgent: req.headers.get("user-agent"),
    });

    const previewUrl = await getSignedReceiptUrl(key);
    return NextResponse.json({ key, previewUrl, fileHash }, { status: 201 });
  } catch (err) {
    console.error("upload error:", err);
    return NextResponse.json(
      { error: "Kunde inte spara bilden." },
      { status: 500 },
    );
  }
}
