import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSek, formatDate } from "@/lib/utils";
import type { Receipt } from "@/db/schema";
import { getT } from "@/lib/i18n-server";

const statusStyles: Record<string, string> = {
  approved: "text-green-600 dark:text-green-400",
  pending: "text-amber-600 dark:text-amber-400",
  rejected: "text-red-600 dark:text-red-400",
};

export function RecentReceipts({ receipts }: { receipts: Receipt[] }) {
  const t = getT();
  const statusLabel: Record<string, string> = {
    approved: t.statusApproved,
    pending: t.statusPending,
    rejected: t.statusRejected,
  };

  return (
    <Card className="rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm transition-shadow hover:shadow-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-lg text-gray-900 dark:text-white">
          {t.recentTitle}
        </CardTitle>
        <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
          {t.recentDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {receipts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.noReceiptsYet}{" "}
            <Link
              href="/dashboard/receipts"
              className="text-sky-600 underline transition hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
            >
              {t.uploadFirst}
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
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
                    {r.date ? formatDate(r.date) : "—"}
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatSek(Number(r.totalAmount ?? 0))}
                  </p>
                  <p
                    className={cn(
                      "text-xs",
                      statusStyles[r.status] ?? "text-gray-500 dark:text-gray-400",
                    )}
                  >
                    {statusLabel[r.status] ?? r.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}