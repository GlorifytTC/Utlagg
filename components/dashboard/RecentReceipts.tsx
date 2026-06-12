import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSek, formatDate } from "@/lib/utils";
import type { Receipt } from "@/db/schema";
import { getT } from "@/lib/i18n-server";

const statusStyles: Record<string, string> = {
  approved: "text-green-600 dark:text-green-400",
  pending: "text-amber",
  rejected: "text-red-600 dark:text-red-400",
};

export function RecentReceipts({ receipts }: { receipts: Receipt[] }) {
  const t = getT();
  const statusLabel: Record<string, string> = { approved: t.statusApproved, pending: t.statusPending, rejected: t.statusRejected };
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.recentTitle}</CardTitle>
        <CardDescription>{t.recentDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        {receipts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.noReceiptsYet}{" "}
            <Link href="/dashboard/receipts" className="text-nordic-600 underline">
              {t.uploadFirst}
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {receipts.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.vendorName ?? t.unknownVendor}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {r.date ? formatDate(r.date) : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatSek(Number(r.totalAmount ?? 0))}</p>
                  <p className={"text-xs " + (statusStyles[r.status] ?? "text-gray-500")}>
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
