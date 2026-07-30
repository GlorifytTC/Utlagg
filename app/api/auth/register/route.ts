import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { logAudit, clientIp } from "@/lib/audit";
import { sendVerificationEmail } from "@/lib/email";
import { captureReferral } from "@/lib/referrals";
import { normalizeEmail } from "@/lib/billing/referral-utils";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Lösenordet måste vara minst 8 tecken"),
  name: z.string().min(1).optional(),
  companyName: z.string().optional(),
  // Referral code carried through the signup flow (?ref=CODE → cookie → here).
  ref: z.string().max(32).optional(),
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
      .select({
        id: users.id,
        emailVerified: users.emailVerified,
        emailVerificationTokenExpires: users.emailVerificationTokenExpires,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      if (existing.emailVerified) {
        // A real, active account — this email is genuinely taken.
        return NextResponse.json(
          { error: "E-postadressen är redan registrerad" },
          { status: 409 },
        );
      }
      const expired =
        !existing.emailVerificationTokenExpires ||
        existing.emailVerificationTokenExpires < new Date();
      if (!expired) {
        // They registered minutes ago and the link is still valid — don't
        // silently delete a pending registration, but don't leave them
        // stuck either: tell them what's actually going on.
        return NextResponse.json(
          {
            error:
              "Ett konto med den här e-postadressen väntar redan på bekräftelse. Kolla din inkorg, eller använd \"Skicka länken igen\" på inloggningssidan.",
          },
          { status: 409 },
        );
      }
      // Never verified and the 24h window has passed: this row is dead
      // weight, not a real account. Remove it so the email can be reused —
      // this is what actually unblocks "I never got the email, now I'm
      // stuck" instead of leaving an orphaned unverified row forever.
      await db.delete(users).where(eq(users.id, existing.id));
      await logAudit({
        userId: existing.id,
        action: "user.register.expired_cleanup",
        details: `Removed never-verified expired registration: ${email}`,
        ipAddress: clientIp(req),
      });
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
        // Normalised email + signup IP power referral dedup / ring detection.
        emailNormalized: normalizeEmail(email),
        signupIp: clientIp(req),
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

    // Attribute the referral (immutable, self-referral rejected). The reward
    // only fires later, on the referred user's first paid invoice (see webhook).
    const refCode = parsed.data.ref ?? req.cookies.get("kvittino_ref")?.value;
    if (refCode) {
      try {
        await captureReferral({ referredUserId: user.id, refCode });
      } catch (e) {
        console.error("referral capture failed (non-blocking):", e);
      }
    }

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
