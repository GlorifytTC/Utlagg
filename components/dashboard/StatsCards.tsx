import { Card, CardContent } from "@/components/ui/card";
import { formatSek } from "@/lib/utils";
import { Receipt, TrendingUp, Wallet, Gauge } from "lucide-react";
import { getT } from "@/lib/i18n-server";

export function StatsCards({
  totalReceipts,
  thisMonthReceipts,
  totalAmount,
  usagePercent,
  planLabel,
}: {
  totalReceipts: number;
  thisMonthReceipts: number;
  totalAmount: number;
  usagePercent: number;
  planLabel: string;
}) {
  const t = getT();
  const items = [
    { label: t.statTotalReceipts, value: String(totalReceipts), icon: Receipt },
    { label: t.statThisMonth, value: String(thisMonthReceipts), icon: TrendingUp },
    { label: t.statTotalAmount, value: formatSek(totalAmount), icon: Wallet },
    {
      label: t.statUsage,
      value: usagePercent < 0 ? t.unlimited : `${Math.round(usagePercent)} %`,
      icon: Gauge,
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Card key={it.label} className="h-full">
            <CardContent className="flex h-full items-center gap-4 p-5">
              <div className="rounded-lg bg-nordic-50 p-3 text-nordic-600 dark:bg-nordic-900/30 dark:text-nordic-400">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{it.label}</p>
                <p className="text-xl font-semibold">{it.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
