import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Minst 8 tecken"),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Ogiltig inmatning" },
      { status: 400 },
    );
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.hashedPassword) {
    return NextResponse.json(
      { message: "Detta konto har inget lösenord (BankID)." },
      { status: 400 },
    );
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.hashedPassword);
  if (!ok) {
    return NextResponse.json(
      { message: "Felaktigt nuvarande lösenord" },
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.update(users).set({ hashedPassword }).where(eq(users.id, user.id));
  await logAudit({
    userId: user.id,
    action: "user.password.change",
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
