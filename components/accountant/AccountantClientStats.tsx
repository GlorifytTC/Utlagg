"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, Receipt, CheckCircle, Clock } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { formatSek, formatDate } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { BUCKET_LABELS, type SpendBucket } from "@/lib/stats-categories";

interface Kpi {
  totalAmount: number;
  totalVat: number;
  count: number;
  pendingCount: number;
  avgPerReceipt: number;
  topCategory: { bucket: SpendBucket; amount: number } | null;
}

interface CategoryPoint {
  bucket: SpendBucket;
  amount: number;
  count: number;
}

interface TrendPoint {
  bucket: string;
  amount: number;
  count: number;
}

interface RecentReceipt {
  id: string;
  vendorName: string | null;
  date: string | null;
  totalAmount: string | number | null;
  status: string;
  createdAt: string;
}

interface StatsData {
  kpi: Kpi;
  categories: CategoryPoint[];
  trend: TrendPoint[];
  recentReceipts: RecentReceipt[];
}

const shortMonth = (bucket: string) => {
  const m = parseInt(bucket.split("-")[1] ?? "1", 10);
  return ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"][m - 1] ?? bucket;
};

const statusColors: Record<string, string> = {
  approved: "bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  pending: "bg-amber-100/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  rejected: "bg-red-100/50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
};

const statusLabel = (status: string, lang: string) => {
  const labels: Record<string, { sv: string; en: string }> = {
    approved: { sv: "Godkänd", en: "Approved" },
    pending: { sv: "Väntar", en: "Pending" },
    rejected: { sv: "Avvisad", en: "Rejected" },
  };
  return labels[status]?.[lang === "en" ? "en" : "sv"] ?? status;
};

export function AccountantClientStats({
  companyId,
  onViewAllReceipts,
}: {
  companyId: string;
  onViewAllReceipts?: () => void;
}) {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const [monthData, setMonthData] = useState<StatsData | null>(null);
  const [yearTrend, setYearTrend] = useState<TrendPoint[]>([]);

  useEffect(() => {
    const now = new Date();
    const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const year = String(now.getUTCFullYear());

    const empty: StatsData = {
      kpi: { totalAmount: 0, totalVat: 0, count: 0, pendingCount: 0, avgPerReceipt: 0, topCategory: null },
      categories: [],
      trend: [],
      recentReceipts: [],
    };

    Promise.all([
      fetch(`/api/accountant/clients/${companyId}/stats?month=${month}`).then((r) =>
        r.ok ? r.json() : null,
      ),
      fetch(`/api/accountant/clients/${companyId}/stats?year=${year}`).then((r) =>
        r.ok ? r.json() : null,
      ),
    ])
      .then(([mData, yData]) => {
        setMonthData(mData ?? empty);
        if (yData) setYearTrend(yData.trend ?? []);
      })
      .catch(() => setMonthData(empty));
  }, [companyId]);

  if (!monthData) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
      </div>
    );
  }

  const { kpi, categories, recentReceipts } = monthData;

  const kpiCards = [
    {
      icon: TrendingUp,
      label: t.clientStatsMonthAmount,
      value: formatSek(kpi.totalAmount),
      accent: false,
    },
    {
      icon: Receipt,
      label: t.clientStatsMonthVat,
      value: formatSek(kpi.totalVat),
      accent: false,
    },
    {
      icon: CheckCircle,
      label: t.clientStatsApproved,
      value: String(kpi.count),
      accent: false,
    },
    {
      icon: Clock,
      label: t.clientStatsPending,
      value: String(kpi.pendingCount),
      accent: kpi.pendingCount > 0,
    },
  ];

  const bucketLabel = (b: SpendBucket) =>
    BUCKET_LABELS[b]?.[lang === "en" ? "en" : "sv"] ?? b;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.25 }}
            className="overflow-hidden rounded-2xl border border-gray-900/[0.07] bg-white/60 p-5 backdrop-blur-sm transition-transform active:scale-[0.98] dark:border-white/[0.08] dark:bg-[#0D0D0D]"
          >
            <card.icon
              className={`mb-3 h-4 w-4 ${card.accent ? "text-amber-500" : "text-gray-400"}`}
              strokeWidth={1.5}
            />
            <p className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">
              {card.label}
            </p>
            <p
              className={`mt-1 font-display text-[22px] font-semibold leading-none tracking-tight ${
                card.accent
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {card.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Category breakdown + 12-month trend */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* Categories */}
        <div className="overflow-hidden rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
          <div className="border-b border-gray-900/[0.07] px-5 py-4 dark:border-white/[0.07]">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {t.clientStatsCategories}
            </p>
          </div>
          <div className="p-5">
            {categories.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">—</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={categories}
                  layout="vertical"
                  margin={{ left: 0, right: 12, top: 0, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v))
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="bucket"
                    width={110}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={bucketLabel}
                  />
                  <Tooltip
                    formatter={(v) => [formatSek(Number(v)), ""]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      fontSize: 12,
                    }}
                    cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]} maxBarSize={20}>
                    {categories.map((c) => (
                      <Cell key={c.bucket} fill={BUCKET_LABELS[c.bucket]?.color ?? "#C4522F"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 12-month trend */}
        <div className="overflow-hidden rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
          <div className="border-b border-gray-900/[0.07] px-5 py-4 dark:border-white/[0.07]">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {t.clientStatsTrend}
            </p>
          </div>
          <div className="p-5">
            {yearTrend.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">—</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={yearTrend}>
                  <XAxis
                    dataKey="bucket"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={shortMonth}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v))
                    }
                  />
                  <Tooltip
                    formatter={(v) => [formatSek(Number(v)), ""]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      fontSize: 12,
                    }}
                    cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="#C4522F" maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent receipts */}
      {recentReceipts.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
          <div className="flex items-center justify-between border-b border-gray-900/[0.07] px-5 py-4 dark:border-white/[0.07]">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {t.clientStatsRecent}
            </p>
            <button
              onClick={onViewAllReceipts}
              className="text-sm font-medium text-nordic-600 transition-opacity hover:opacity-70"
            >
              {t.clientStatsViewAll} →
            </button>
          </div>
          <ul className="divide-y divide-gray-900/[0.05] dark:divide-white/[0.05]">
            {recentReceipts.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {r.vendorName || "—"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(r.date ?? r.createdAt)}
                  </p>
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatSek(Number(r.totalAmount))}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[r.status] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {statusLabel(r.status, lang)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
