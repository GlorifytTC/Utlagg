import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserCompany } from "@/lib/company";
import { UserSettingsLayout } from "@/components/settings/UserSettingsLayout";

export const dynamic = "force-dynamic";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const membership = await getUserCompany(session.user.id);
  // Solo users (no company) manage their own billing; otherwise owner only.
  return <UserSettingsLayout showBilling={!membership || membership.role === "owner"}>{children}</UserSettingsLayout>;
}
