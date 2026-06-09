import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, subscriptions, receipts, auditLogs } from "@/db/schema";
import { formatDate, formatSek } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { AdminSubscriptionControl } from "@/components/admin/AdminSubscriptionControl";

export const metadata = { title: "Admin · Användare" };
export const dynamic = "force-dynamic";

export default async function AdminUserDetail({ params }: { params: { id: string } }) {
  const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
  if (!user) notFound();

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, params.id))
    .limit(1);

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
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.email}</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {user.name ?? "—"} · {user.subscriptionTier} · {user.subscriptionStatus} · sedan {formatDate(user.createdAt)}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Åtgärder</CardTitle></CardHeader>
        <CardContent><AdminUserActions userId={user.id} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Prenumeration — full kontroll</CardTitle></CardHeader>
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
        <CardHeader><CardTitle>Senaste kvitton</CardTitle></CardHeader>
        <CardContent>
          {userReceipts.length === 0 ? (
            <p className="text-sm text-gray-500">Inga kvitton.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
              {userReceipts.map((r: Record<string, unknown>) => (
                <li key={r.id as string} className="flex justify-between py-2">
                  <span>{(r.vendorName as string) ?? "—"}</span>
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
            <p className="text-sm text-gray-500">Inga händelser.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {logs.map((l: Record<string, unknown>) => (
                <li key={l.id as string} className="flex justify-between">
                  <span className="font-mono text-xs">{l.action as string}</span>
                  <span className="text-gray-500">{formatDate(l.createdAt as Date)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
