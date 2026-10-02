import { AccountantReceipts } from "@/components/accountant/AccountantReceipts";
import { getServerLang } from "@/lib/i18n-server";
import { accountantStrings } from "@/lib/accountant-i18n";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Kvitton" };
export const dynamic = "force-dynamic";

export default function AccountantWorkQueuePage({ searchParams }: { searchParams: { filter?: string } }) {
  const t = accountantStrings(getServerLang());
  const filter = searchParams.filter === "uncertain" || searchParams.filter === "missing" ? searchParams.filter : "review";
  const [title, subtitle] = {
    review: [t.rcTitleReview, t.rcSubReview],
    uncertain: [t.rcTitleUncertain, t.rcSubUncertain],
    missing: [t.todoMissingInfo, t.rcSubMissing],
  }[filter];
  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader title={title} subtitle={subtitle} />
      <AccountantReceipts filter={filter} />
    </div>
  );
}
