import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { logAudit, clientIp } from "@/lib/audit";

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

    const [user] = await db
      .insert(users)
      .values({
        email,
        hashedPassword,
        name: parsed.data.name,
        companyName: parsed.data.companyName,
        subscriptionTier: "free",
        scanLimit: 25,
      })
      .returning({ id: users.id, email: users.email });

    await logAudit({
      userId: user.id,
      action: "user.register",
      details: `New account: ${email}`,
      ipAddress: clientIp(req),
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (err) {
    console.error("register error:", err);
    return NextResponse.json(
      { error: "Något gick fel. Försök igen." },
      { status: 500 },
    );
  }
}
