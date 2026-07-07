import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { SubscriptionManager } from "@/components/dashboard/SubscriptionManager";
import { InvoiceHistory } from "@/components/dashboard/InvoiceHistory";
import { getT } from "@/lib/i18n-server";

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
  const t = getT();

  // One row per user; a past_due customer still needs the billing portal and
  // invoice list, so don't filter on status here.
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  const periodEnd =
    (sub?.status === "active" || sub?.status === "trialing") &&
    sub.currentPeriodEnd instanceof Date
      ? sub.currentPeriodEnd.toISOString()
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.navSubscription}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t.subManageDesc}</p>
      </div>
      <SubscriptionManager
        currentTier={user.subscriptionTier}
        periodEnd={periodEnd}
        hasBilling={Boolean(sub?.stripeCustomerId)}
      />
      <InvoiceHistory />
    </div>
  );
}
