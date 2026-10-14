import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getPayerUserId } from "@/lib/company";
import type { Tier } from "@/lib/plans";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  // Accountants have their own workspace; /dashboard would only bounce them back.
  const [me] = await db.select({ isAccountant: users.isAccountant }).from(users).where(eq(users.id, session.user.id)).limit(1);
  if (me?.isAccountant) redirect("/accountant");

  const [u] = await db
    .select({ tier: users.subscriptionTier })
    .from(users)
    .where(eq(users.id, await getPayerUserId(session.user.id)))
    .limit(1);

  return (
    <DashboardChrome tier={(u?.tier ?? "free") as Tier}>{children}</DashboardChrome>
  );
}
