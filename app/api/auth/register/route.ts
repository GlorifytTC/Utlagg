import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { logAudit, clientIp } from "@/lib/audit";
import { sendVerificationEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Lösenordet måste vara minst 8 tecken"),
  name: z.string().min(1).optional(),
  companyName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter" },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "E-postadressen är redan registrerad" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

    // Account is created but stays unverified — emailVerified is null until
    // they click the link, and login is blocked until then (see lib/auth.ts).
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const [user] = await db
      .insert(users)
      .values({
        email,
        hashedPassword,
        name: parsed.data.name,
        companyName: parsed.data.companyName,
        subscriptionTier: "free",
        scanLimit: 25,
        emailVerificationToken: tokenHash,
        emailVerificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      .returning({ id: users.id, email: users.email });

    await logAudit({
      userId: user.id,
      action: "user.register",
      details: `New account (pending verification): ${email}`,
      ipAddress: clientIp(req),
    });

    const emailSent = await sendVerificationEmail(
      user.email,
      parsed.data.name ?? "där",
      rawToken,
    );

    return NextResponse.json(
      { id: user.id, email: user.email, verificationEmailSent: emailSent },
      { status: 201 },
    );
  } catch (err) {
    console.error("register error:", err);
    return NextResponse.json(
      { error: "Något gick fel. Försök igen." },
      { status: 500 },
    );
  }
}
