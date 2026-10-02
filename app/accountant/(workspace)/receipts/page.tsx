import { AccountantReceipts } from "@/components/accountant/AccountantReceipts";
import { getServerLang } from "@/lib/i18n-server";
import { accountantStrings } from "@/lib/accountant-i18n";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Kvitton" };
export const dynamic = "force-dynamic";

export default function AccountantWorkQueuePage({ searchParams }: { searchParams: { filter?: string } }) {
  const t = accountantStrings(getServerLang());
  const uncertain = searchParams.filter === "uncertain";
  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader
        title={uncertain ? t.rcTitleUncertain : t.rcTitleReview}
        subtitle={uncertain ? t.rcSubUncertain : t.rcSubReview}
      />
      <AccountantReceipts filter={uncertain ? "uncertain" : "review"} />
    </div>
  );
}
