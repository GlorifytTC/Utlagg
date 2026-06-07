import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { integrationTokens, receipts } from "@/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FortnoxPanel } from "@/components/dashboard/FortnoxPanel";

export const metadata = { title: "Integrationer" };
export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [token] = await db
    .select({ id: integrationTokens.id })
    .from(integrationTokens)
    .where(and(eq(integrationTokens.userId, session.user.id), eq(integrationTokens.provider, "fortnox")))
    .limit(1);

  const [{ unsynced }] = (await db
    .select({ unsynced: sql<number>`count(*)::int` })
    .from(receipts)
    .where(and(eq(receipts.userId, session.user.id), eq(receipts.fortnoxSynced, false)))) as {
    unsynced: number;
  }[];

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integrationer</h1>
      <Card>
        <CardHeader>
          <CardTitle>Fortnox</CardTitle>
          <CardDescription>
            Bokför dina kvitton automatiskt som verifikationer i Fortnox.
            {token ? ` ${Number(unsynced)} kvitton väntar på synk.` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FortnoxPanel connected={Boolean(token)} />
        </CardContent>
      </Card>
      <p className="text-xs text-gray-400">
        Konteringen (vilka BAS-konton verifikationen bokförs på) bör stämmas av med din
        bokföringsbyrå innan du synkar skarpt.
      </p>
    </div>
  );
}
