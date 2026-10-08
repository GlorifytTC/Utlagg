import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, subscriptions, receipts, auditLogs } from "@/db/schema";
import { formatDate, formatSek } from "@/lib/utils";
import { requireAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { AdminSubscriptionControl } from "@/components/admin/AdminSubscriptionControl";
import { AdminRefund, type AdminCharge } from "@/components/admin/AdminRefund";
import { stripe } from "@/lib/stripe";

export const metadata = { title: "Admin · Användare" };
export const dynamic = "force-dynamic";

export default async function AdminUserDetail({ params }: { params: { id: string } }) {
  // Gate at the data-fetch point, not just the parent layout - this page reads
  // arbitrary user PII + audit logs, so it must not depend solely on the layout.
  if (!(await requireAdmin())) notFound();
  const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
  if (!user) notFound();

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, params.id))
    .limit(1);

  // ponytail: charges of the user's Stripe customer only; customer-less
  // one-offs (credit pack / boost via customer_email) are refunded in Stripe.
  let charges: AdminCharge[] = [];
  if (sub?.stripeCustomerId) {
    try {
      const list = await stripe.charges.list({ customer: sub.stripeCustomerId, limit: 10 });
      charges = list.data.map((c) => ({
        id: c.id,
        created: new Date(c.created * 1000).toISOString(),
        amountOre: c.amount,
        refunded: c.refunded,
      }));
    } catch (e) {
      console.error("admin charge list failed:", e);
    }
  }

  const userReceipts = await db
    .select()
    .from(receipts)
    .where(eq(receipts.userId, params.id))
    .orderBy(desc(receipts.createdAt))
    .limit(10);

  const logs = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, params.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(15);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        back={{ href: "/admin/users", label: "Användare" }}
        title={<span className="break-all">{user.email}</span>}
        subtitle={`${user.name ?? "-"} · ${user.subscriptionTier} · ${user.subscriptionStatus} · sedan ${formatDate(user.createdAt)}`}
      />

      <Card>
        <CardHeader><CardTitle>Åtgärder</CardTitle></CardHeader>
        <CardContent><AdminUserActions userId={user.id} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Prenumeration - full kontroll</CardTitle></CardHeader>
        <CardContent>
          <AdminSubscriptionControl
            userId={user.id}
            current={{
              tier: user.subscriptionTier,
              status: user.subscriptionStatus,
              source: user.subscriptionSource ?? null,
              grantedUntil: user.subscriptionGrantedUntil
                ? new Date(user.subscriptionGrantedUntil).toISOString()
                : null,
              paused: user.subscriptionPaused,
              customSeats: user.customSeats ?? null,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Stripe-prenumeration</CardTitle></CardHeader>
        <CardContent className="text-sm">
          {sub ? (
            <p>
              {sub.tier} · {sub.status}
              {sub.currentPeriodEnd ? ` · förnyas ${formatDate(sub.currentPeriodEnd)}` : ""}
              {sub.stripeCustomerId ? ` · ${sub.stripeCustomerId}` : ""}
            </p>
          ) : (
            <p className="text-gray-500">Ingen prenumerationspost.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Återbetalning</CardTitle></CardHeader>
        <CardContent><AdminRefund userId={user.id} charges={charges} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Senaste kvitton</CardTitle></CardHeader>
        <CardContent>
          {userReceipts.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Inga kvitton.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
              {userReceipts.map((r: Record<string, unknown>) => (
                <li key={r.id as string} className="flex justify-between gap-3 py-2">
                  <span>{(r.vendorName as string) ?? "-"}</span>
                  <span>{formatSek(Number(r.totalAmount ?? 0))}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Revisionslogg</CardTitle></CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Inga händelser.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {logs.map((l: Record<string, unknown>) => (
                <li key={l.id as string} className="flex justify-between">
                  <span className="font-mono text-xs">{l.action as string}</span>
                  <span className="text-gray-500 dark:text-gray-400">{formatDate(l.createdAt as Date)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
