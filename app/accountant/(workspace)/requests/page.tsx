import { AccountantRequests } from "@/components/accountant/AccountantRequests";
import { getServerLang } from "@/lib/i18n-server";
import { accountantStrings } from "@/lib/accountant-i18n";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Förfrågningar" };
export const dynamic = "force-dynamic";

export default function AccountantRequestsPage() {
  const t = accountantStrings(getServerLang());
  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader title={t.navRequests} subtitle={t.requestsSubtitle} />
      <AccountantRequests />
    </div>
  );
}
