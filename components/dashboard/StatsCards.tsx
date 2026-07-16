import { formatSek } from "@/lib/utils";
import { Receipt, TrendingUp, Wallet, Gauge } from "lucide-react";
import { getT } from "@/lib/i18n-server";
import type { LucideIcon } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

function StatCell({
  label,
  value,
  icon: Icon,
  tip,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tip: string;
}) {
  return (
    <div className="group bg-[#F5F4F0] p-5 transition-colors hover:bg-gray-900/[0.03] dark:bg-[#0D0D0D] dark:hover:bg-white/[0.04]">
      <div className="mb-3">
        <Tooltip label={tip} side="top" wide>
          <p className="cursor-help text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400 decoration-dotted underline-offset-[3px] transition-colors hover:text-gray-500 hover:underline dark:text-gray-400 dark:hover:text-gray-300">
            {label}
          </p>
        </Tooltip>
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="font-display text-[22px] font-semibold leading-none tracking-tight text-gray-900 transition-colors group-hover:text-gray-800 dark:text-white dark:group-hover:text-gray-100">
          {value}
        </p>
        <Icon
          className="mb-0.5 h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-gray-400 dark:text-gray-500 dark:group-hover:text-gray-400"
          strokeWidth={1.5}
        />
      </div>
    </div>
  );
}

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
    { label: t.statTotalReceipts, value: String(totalReceipts), icon: Receipt, tip: t.tipStatTotal },
    { label: t.statThisMonth, value: String(thisMonthReceipts), icon: TrendingUp, tip: t.tipStatMonth },
    { label: t.statTotalAmount, value: formatSek(totalAmount), icon: Wallet, tip: t.tipStatAmount },
    {
      label: t.statUsage,
      value: usagePercent < 0 ? t.unlimited : `${Math.round(usagePercent)}\u2009%`,
      icon: Gauge,
      tip: t.tipStatUsage,
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-900/[0.07] transition-shadow hover:shadow-sm dark:border-white/[0.07]">
      <div className="grid grid-cols-1 gap-px bg-gray-900/[0.07] sm:grid-cols-2 lg:grid-cols-4 dark:bg-white/[0.07]">
        {items.map((item) => (
          <StatCell key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
}