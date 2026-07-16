import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { SubscriptionManager } from "@/components/dashboard/SubscriptionManager";
import { InvoiceHistory } from "@/components/dashboard/InvoiceHistory";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { getT } from "@/lib/i18n-server";
import { currentTier } from "@/lib/entitlements";

export const metadata = { title: "Prenumeration" };
export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  // Read the raw row FIRST (to see if a grant just lapsed), then resolve the
  // effective tier — currentTier() also persists an expired grant, so after
  // this call the DB and the UI agree.
  const [before] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!before) redirect("/login");

  const justExpired =
    !!before.subscriptionGrantedUntil &&
    new Date(before.subscriptionGrantedUntil).getTime() < Date.now();

  // IMPORTANT: show the EFFECTIVE tier — the same one the feature gates use.
  // Reading users.subscriptionTier directly made this page claim "You're on
  // the Business plan" while the gates treated the account as free, so the
  // premium pages showed an upgrade wall. One source of truth now.
  const effective = await currentTier();
  const effectiveTier = effective?.tier ?? "free";

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
      <PageHeader title={t.navSubscription} description={t.pdSubscription} />
      {justExpired && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {t.subGrantExpiredNotice}
        </div>
      )}
      {!justExpired && before.subscriptionPaused && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {t.subPausedNotice}
        </div>
      )}
      <SubscriptionManager
        currentTier={effectiveTier}
        periodEnd={periodEnd}
        hasBilling={Boolean(sub?.stripeCustomerId)}
      />
      <InvoiceHistory />
    </div>
  );
}
