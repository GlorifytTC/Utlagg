import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  isStorageConfigured,
  keyBelongsToUser,
  getSignedReceiptUrl,
} from "@/lib/storage";

export const runtime = "nodejs";

/**
 * GET /api/receipts/image?key=receipts/<userId>/<id>.jpg
 * Returns a short-lived presigned URL, but only if the key belongs to the
 * authenticated user. Keeps the bucket private.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "Lagring ej konfigurerad" }, { status: 503 });
  }

  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key saknas" }, { status: 400 });
  }
  if (!keyBelongsToUser(key, session.user.id)) {
    return NextResponse.json({ error: "Åtkomst nekad" }, { status: 403 });
  }

  const url = await getSignedReceiptUrl(key);
  return NextResponse.json({ url });
}
