import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSek, formatDate } from "@/lib/utils";
import type { Receipt } from "@/db/schema";
import { getT, getServerLang } from "@/lib/i18n-server";
import { ReviewerStack } from "@/components/dashboard/ReviewerStack";
import type { ReceiptPeople } from "@/lib/receipts/people";

const statusStyles: Record<string, string> = {
  approved: "text-green-700 dark:text-green-400",
  pending: "text-amber-700 dark:text-amber-400",
  rejected: "text-red-600 dark:text-red-400",
};

export function RecentReceipts({
  receipts,
  people,
}: {
  receipts: Receipt[];
  people: Map<string, ReceiptPeople>;
}) {
  const t = getT();
  const lang = getServerLang();
  const statusLabel: Record<string, string> = {
    approved: t.statusApproved,
    pending: t.statusPending,
    rejected: t.statusRejected,
  };

  // Solo users have no approval workflow, so no approver bubble for them.
  const approverOf = (r: Receipt) => (r.companyId ? people.get(r.id)?.approver : null);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle as="h2">{t.recentTitle}</CardTitle>
        <CardDescription>
          {t.recentDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {receipts.length === 0 ? (
          <div className="py-4 text-center">
            <p className="font-medium text-gray-900 dark:text-white">{t.noReceiptsYet}</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{t.recentEmptyBody}</p>
            <Link
              href="/dashboard/receipts"
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-nordic-600 px-6 text-sm font-medium text-white transition hover:bg-nordic-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20"
            >
              {t.uploadFirst}
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-900/[0.06] dark:divide-white/[0.06]">
            {receipts.map((r, i) => (
              <li
                key={r.id}
                className="flex items-center justify-between py-3 transition-colors hover:bg-gray-900/[0.02] dark:hover:bg-white/[0.02]"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 dark:text-white">
                    {r.vendorName ?? t.unknownVendor}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {r.date ? formatDate(r.date, lang) : "-"}
                  </p>
                </div>
                <div className="ml-4 shrink-0 text-right">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatSek(Number(r.totalAmount ?? 0))}
                  </p>
                  {r.status === "approved" && (approverOf(r) || people.get(r.id)?.reviewers.length) ? (
                    <ReviewerStack
                      className="mt-1"
                      approver={approverOf(r)}
                      reviewers={people.get(r.id)?.reviewers ?? []}
                    />
                  ) : r.status === "approved" ? null : (
                  <p
                    className={cn(
                      "text-xs",
                      statusStyles[r.status] ?? "text-gray-500 dark:text-gray-400",
                    )}
                  >
                    {statusLabel[r.status] ?? r.status}
                  </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}