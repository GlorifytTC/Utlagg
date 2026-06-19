// app/api/auth/forgot-password/route.ts

import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkLimit } from "@/lib/rate-limit";
import { clientIp, logAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email() });

function hashToken(t: string) {
  return crypto.createHash("sha256").update(t).digest("hex");
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req) ?? "anon";
  if (!(await checkLimit("auth", `forgot:${ip}`))) {
    return NextResponse.json({ error: "För många försök" }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json());
  // Always respond 200 to avoid leaking which emails exist.
  if (!parsed.success) return NextResponse.json({ ok: true });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email.toLowerCase()))
    .limit(1);

  if (user) {
    const raw = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await db
      .update(users)
      .set({
        passwordResetToken: hashToken(raw),
        passwordResetTokenExpires: expires,
      })
      .where(eq(users.id, user.id));
    
    // ✅ FIXED: Pass 3 arguments (email, token, name)
    await sendPasswordResetEmail(user.email, raw, user.name || 'Användare');
    
    await logAudit({ userId: user.id, action: "auth.password.reset_requested", ipAddress: ip });
    logger.info({ userId: user.id }, "password reset requested");
  }

  return NextResponse.json({ ok: true });
}