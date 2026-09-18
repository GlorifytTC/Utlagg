import { redirect } from "next/navigation";
import { requireAccountant } from "@/lib/accountant";
import { AccountantChrome } from "@/components/accountant/AccountantChrome";

export const dynamic = "force-dynamic";

export default async function AccountantWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const acct = await requireAccountant();
  if (!acct) redirect("/dashboard");

  return <AccountantChrome>{children}</AccountantChrome>;
}
