import { metaTitle } from "@/lib/i18n-server";
import { AccountantDashboard } from "@/components/accountant/AccountantDashboard";

export const generateMetadata = metaTitle("Översikt", "Overview");
export const dynamic = "force-dynamic";

export default function AccountantDashboardPage() {
  return <AccountantDashboard />;
}
