import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  companyName: z.string().trim().max(200).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltiga fält" }, { status: 400 });
  }
  // The Verified badge vouches for the name an admin checked against the
  // credential document, so a rename sends an approved accountant back to
  // review. Bumping verificationUpdatedAt also when pending makes an admin's
  // in-flight decision fail (409) instead of approving a name they never saw.
  const [current] = await db
    .select({ name: users.name, verificationStatus: users.verificationStatus })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  const reverify =
    parsed.data.name !== undefined &&
    parsed.data.name !== current?.name &&
    (current?.verificationStatus === "approved" || current?.verificationStatus === "pending");
  await db
    .update(users)
    .set(reverify ? { ...parsed.data, verificationStatus: "pending", verificationUpdatedAt: new Date() } : parsed.data)
    .where(eq(users.id, session.user.id));
  await logAudit({
    userId: session.user.id,
    action: "user.update",
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
