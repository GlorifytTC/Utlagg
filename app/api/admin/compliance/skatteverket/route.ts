import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { skatteverketCsv } from "@/lib/compliance";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const csv = await skatteverketCsv(
    req.nextUrl.searchParams.get("from") ?? undefined,
    req.nextUrl.searchParams.get("to") ?? undefined,
  );
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="skatteverket-kvitton.csv"',
    },
  });
}
