import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAccountant } from "@/lib/accountant";
import { AccountantSettings } from "@/components/accountant/AccountantSettings";

export const metadata = { title: "Inställningar" };
export const dynamic = "force-dynamic";

export default async function AccountantSettingsPage() {
  const acct = await requireAccountant();
  if (!acct) redirect("/dashboard");
  const [u] = await db
    .select({
      logoUrl: users.logoUrl,
      verificationStatus: users.verificationStatus,
      verificationNote: users.verificationNote,
    })
    .from(users)
    .where(eq(users.id, acct.userId))
    .limit(1);

  return (
    <AccountantSettings
      logoUrl={u?.logoUrl ?? null}
      verificationStatus={u?.verificationStatus ?? null}
      verificationNote={u?.verificationNote ?? null}
    />
  );
}
