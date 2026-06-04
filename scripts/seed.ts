/**
 * Optional dev/staging seed. Creates one test user you can log in with.
 * Run: railway run npm run db:seed   (or: npm run db:seed with DATABASE_URL set)
 *
 * Safe to re-run: it upserts on email.
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

const EMAIL = process.env.SEED_EMAIL ?? "test@kvitto.se";
const PASSWORD = process.env.SEED_PASSWORD ?? "test1234";

async function main() {
  const hashedPassword = await bcrypt.hash(PASSWORD, 12);

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, EMAIL))
    .limit(1);

  if (existing) {
    await db
      .update(users)
      .set({ hashedPassword, scansUsedThisMonth: 0, scanLimit: 25 })
      .where(eq(users.id, existing.id));
    console.log(`Updated existing seed user: ${EMAIL}`);
  } else {
    await db.insert(users).values({
      email: EMAIL,
      hashedPassword,
      name: "Test Testsson",
      companyName: "Testbolaget AB",
      subscriptionTier: "free",
      scanLimit: 25,
    });
    console.log(`Created seed user: ${EMAIL} / ${PASSWORD}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
