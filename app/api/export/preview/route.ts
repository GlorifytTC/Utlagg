import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exportPreview } from "@/lib/export-preview";
import { parseRange } from "@/lib/export-range";

export const runtime = "nodejs";

/** Counts + totals for the selected period (same filters as the export routes). */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  return NextResponse.json(await exportPreview([session.user.id], parseRange(req.nextUrl.searchParams)));
}
