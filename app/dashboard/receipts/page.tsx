import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ReceiptsManager } from "@/components/dashboard/ReceiptsManager";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { getT } from "@/lib/i18n-server";

export const metadata = { title: "Kvitton" };
export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const t = getT();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader title={t.navReceipts} description={t.pdReceipts} />
      <ReceiptsManager
        used={user.scansUsedThisMonth}
        limit={user.scanLimit}
        tier={user.subscriptionTier}
      />
    </div>
  );
}
