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
    .select({ name: users.name, email: users.email, logoUrl: users.logoUrl })
    .from(users)
    .where(eq(users.id, acct.userId))
    .limit(1);

  return <AccountantSettings name={u?.name ?? ""} email={u?.email ?? ""} logoUrl={u?.logoUrl ?? null} />;
}
