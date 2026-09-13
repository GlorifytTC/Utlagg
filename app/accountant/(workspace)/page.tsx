import { AccountantDashboard } from "@/components/accountant/AccountantDashboard";

export const metadata = { title: "Översikt" };
export const dynamic = "force-dynamic";

export default function AccountantDashboardPage() {
  return <AccountantDashboard />;
}
