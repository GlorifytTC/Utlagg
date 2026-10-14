import { AccountantRequests } from "@/components/accountant/AccountantRequests";
import { getServerLang, metaTitle } from "@/lib/i18n-server";
import { accountantStrings } from "@/lib/accountant-i18n";
import { PageHeader } from "@/components/ui/page-header";

export const generateMetadata = metaTitle("Förfrågningar", "Requests");
export const dynamic = "force-dynamic";

export default function AccountantRequestsPage() {
  const t = accountantStrings(getServerLang());
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={t.navRequests} subtitle={t.requestsSubtitle} />
      <AccountantRequests />
    </div>
  );
}
