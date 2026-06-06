import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { SubscriptionManager } from "@/components/dashboard/SubscriptionManager";

export const metadata = { title: "Prenumeration" };
export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user) redirect("/login");

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, session.user.id),
        eq(subscriptions.status, "active"),
      ),
    )
    .limit(1);

  const periodEnd =
    sub?.currentPeriodEnd instanceof Date
      ? sub.currentPeriodEnd.toISOString()
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prenumeration</h1>
        <p className="text-gray-500 dark:text-gray-400">Hantera din plan och fakturering</p>
      </div>
      <SubscriptionManager currentTier={user.subscriptionTier} periodEnd={periodEnd} />
    </div>
  );
}
