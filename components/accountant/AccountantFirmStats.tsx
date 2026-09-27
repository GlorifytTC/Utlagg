"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Clock, TrendingUp, Receipt } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { formatSek } from "@/lib/utils";
import { StatGrid } from "@/components/ui/stat";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { BUCKET_LABELS, type SpendBucket } from "@/lib/stats-categories";

interface FirmStats {
  totalClients: number;
  pendingCount: number;
  monthAmount: number;
  monthVat: number;
  clientsWithPending: { companyId: string; companyName: string; pendingCount: number }[];
  categories: { bucket: SpendBucket; amount: number; count: number }[];
  throughput: { bucket: string; count: number }[];
}

const EMPTY_STATS: FirmStats = { totalClients: 0, pendingCount: 0, monthAmount: 0, monthVat: 0, clientsWithPending: [], categories: [], throughput: [] };

const shortMonth = (bucket: string) => {
  const m = parseInt(bucket.split("-")[1] ?? "1", 10);
  return ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"][m - 1] ?? bucket;
};

export function AccountantFirmStats() {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const [stats, setStats] = useState<FirmStats | null>(null);

  useEffect(() => {
    // Any failure (network or non-2xx) falls back to zeros, never an endless skeleton
    fetch("/api/accountant/firm/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStats(d ?? EMPTY_STATS))
      .catch(() => setStats(EMPTY_STATS));
  }, []);

  if (!stats) {
    return (
      <div className="h-[116px] animate-pulse rounded-2xl bg-gray-900/[0.04] dark:bg-white/[0.04]" />
    );
  }

  const kpiCards = [
    {
      icon: Users,
      label: t.firmStatsClients,
      value: String(stats.totalClients),
      accent: false,
    },
    {
      icon: Clock,
      label: t.firmStatsPending,
      value: String(stats.pendingCount),
      accent: stats.pendingCount > 0,
    },
    {
      icon: TrendingUp,
      label: t.firmStatsMonthAmount,
      value: formatSek(stats.monthAmount),
      accent: false,
    },
    {
      icon: Receipt,
      label: t.firmStatsMonthVat,
      value: formatSek(stats.monthVat),
      accent: false,
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
      <StatGrid
        items={kpiCards.map((c) => ({
          label: c.label,
          value: c.value,
          icon: c.icon,
          tone: c.accent ? ("warn" as const) : ("default" as const),
        }))}
      />

      {/* Clients needing attention + category breakdown */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* Pending clients */}
        <div className="overflow-hidden rounded-2xl panel">
          <div className="border-b border-gray-900/[0.07] px-5 py-4 dark:border-white/[0.07]">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {t.firmStatsNeedsAttention}
            </p>
          </div>
          {stats.clientsWithPending.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.firmStatsAllClear}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-900/[0.05] dark:divide-white/[0.05]">
              {stats.clientsWithPending.map((c) => (
                <li key={c.companyId} className="flex items-center justify-between px-5 py-3">
                  <span className="truncate pr-3 text-sm font-medium text-gray-900 dark:text-white">
                    {c.companyName}
                  </span>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="rounded-full bg-amber-100/70 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      {c.pendingCount} {t.firmStatsPendingLabel}
                    </span>
                    <Link
                      href={`/accountant/clients/${c.companyId}`}
                      className="text-sm font-medium text-nordic-600 transition-opacity hover:opacity-70"
                    >
                      {t.openClient} →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Category spend */}
        <div className="overflow-hidden rounded-2xl panel">
          <div className="border-b border-gray-900/[0.07] px-5 py-4 dark:border-white/[0.07]">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {t.firmStatsCategories}
            </p>
          </div>
          <div className="p-5">
            {stats.categories.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">-</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={stats.categories}
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
                    {stats.categories.map((c) => (
                      <Cell key={c.bucket} fill={BUCKET_LABELS[c.bucket]?.color ?? "#C4522F"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 12-month throughput */}
      {stats.throughput.length > 0 && (
        <div className="overflow-hidden rounded-2xl panel">
          <div className="border-b border-gray-900/[0.07] px-5 py-4 dark:border-white/[0.07]">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {t.firmStatsThroughput}
            </p>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.throughput}>
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
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(v) => [Number(v), lang === "en" ? "receipts" : "kvitton"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                  }}
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#C4522F" maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
}
