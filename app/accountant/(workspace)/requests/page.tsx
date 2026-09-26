import { AccountantRequests } from "@/components/accountant/AccountantRequests";
import { getServerLang } from "@/lib/i18n-server";
import { accountantStrings } from "@/lib/accountant-i18n";

export const metadata = { title: "Förfrågningar" };
export const dynamic = "force-dynamic";

export default function AccountantRequestsPage() {
  const t = accountantStrings(getServerLang());
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{t.navRequests}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.requestsSubtitle}</p>
      </div>
      <AccountantRequests />
    </div>
  );
}
