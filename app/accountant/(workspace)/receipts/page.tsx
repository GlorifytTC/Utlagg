import { AccountantReceipts } from "@/components/accountant/AccountantReceipts";
import { getServerLang } from "@/lib/i18n-server";
import { accountantStrings } from "@/lib/accountant-i18n";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Kvitton" };
export const dynamic = "force-dynamic";

export default function AccountantWorkQueuePage({ searchParams }: { searchParams: { filter?: string; range?: string } }) {
  const t = accountantStrings(getServerLang());
  const filter = (["uncertain", "missing", "pending", "month", "reviewed"] as const).find((f) => f === searchParams.filter) ?? "review";
  const range = searchParams.range === "week" ? "week" : "month";
  const [title, subtitle] = {
    review: [t.rcTitleReview, t.rcSubReview],
    uncertain: [t.rcTitleUncertain, t.rcSubUncertain],
    missing: [t.todoMissingInfo, t.rcSubMissing],
    pending: [t.rcTitlePending, t.rcSubPending],
    month: [t.rcTitleMonth, t.rcSubMonth],
    reviewed: [range === "week" ? t.rcTitleReviewedWeek : t.rcTitleReviewedMonth, t.rcSubReviewed],
  }[filter];
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={title} subtitle={subtitle} />
      <AccountantReceipts filter={filter} range={range} />
    </div>
  );
}
