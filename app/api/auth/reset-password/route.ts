import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { checkLimit } from "@/lib/rate-limit";
import { clientIp, logAudit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Minst 8 tecken"),
});

export async function POST(req: NextRequest) {
  const ip = clientIp(req) ?? "anon";
  if (!(await checkLimit("auth", `reset:${ip}`))) {
    return NextResponse.json({ error: "För många försök" }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Ogiltig inmatning" },
      { status: 400 },
    );
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(parsed.data.token)
    .digest("hex");

  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.passwordResetToken, tokenHash),
        gt(users.passwordResetTokenExpires, new Date()),
      ),
    )
    .limit(1);

  if (!user) {
    return NextResponse.json(
      { message: "Länken är ogiltig eller har gått ut." },
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
  await db
    .update(users)
    .set({
      hashedPassword,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
    })
    .where(eq(users.id, user.id));
  await logAudit({ userId: user.id, action: "auth.password.reset", ipAddress: ip });

  return NextResponse.json({ ok: true });
}
