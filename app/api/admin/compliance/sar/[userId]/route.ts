import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { buildSar } from "@/lib/compliance";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sar = await buildSar(params.userId);
  if (!sar) return NextResponse.json({ error: "Ej hittad" }, { status: 404 });
  return new NextResponse(JSON.stringify(sar, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="sar-${params.userId}.json"`,
    },
  });
}
