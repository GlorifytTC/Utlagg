import { formatSek } from "@/lib/utils";
import { Receipt, TrendingUp, Wallet, Gauge } from "lucide-react";
import { getT } from "@/lib/i18n-server";
import { StatGrid } from "@/components/ui/stat";

export function StatsCards({
  totalReceipts,
  thisMonthReceipts,
  totalAmount,
  usagePercent,
}: {
  totalReceipts: number;
  thisMonthReceipts: number;
  totalAmount: number;
  usagePercent: number;
  planLabel?: string;
}) {
  const t = getT();

  return (
    <StatGrid
      items={[
        { label: t.statTotalReceipts, value: String(totalReceipts), icon: Receipt },
        { label: t.statThisMonth, value: String(thisMonthReceipts), icon: TrendingUp },
        { label: t.statTotalAmount, value: formatSek(totalAmount), icon: Wallet },
        {
          label: t.statUsage,
          value: usagePercent < 0 ? t.unlimited : `${Math.round(usagePercent)} %`,
          icon: Gauge,
          tone: usagePercent >= 90 ? "warn" : "default",
        },
      ]}
    />
  );
}
