import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { checkLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  if (!(await checkLimit("auth", `verify:${clientIp(req) ?? session.user.id}`))) {
    return NextResponse.json({ error: "För många försök" }, { status: 429 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user) {
    return NextResponse.json({ error: "Ej hittad" }, { status: 404 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ message: "E-post redan verifierad" }, { status: 400 });
  }

  const raw = crypto.randomBytes(32).toString("hex");
  await db
    .update(users)
    .set({
      emailVerificationToken: crypto.createHash("sha256").update(raw).digest("hex"),
      emailVerificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    .where(eq(users.id, user.id));
  await sendVerificationEmail(user.email, user.name ?? "där", raw);

  return NextResponse.json({ ok: true });
}
