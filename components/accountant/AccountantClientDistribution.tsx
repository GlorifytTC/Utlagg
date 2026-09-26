"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { formatSek } from "@/lib/utils";

type Range = "day" | "week" | "month" | "3m" | "6m" | "year";

interface ClientSlice {
  companyId: string;
  companyName: string;
  count: number;
  amount: number;
}

// ponytail: warm earth palette matching terracotta brand accent; cycles if >8 clients
const COLORS = ["#C4522F", "#E07A5F", "#D9A441", "#8C6A4A", "#81B29A", "#3D405B", "#F4A261", "#9C6644"];
const SLICE_CAP = 8;

function buildSlices(
  data: ClientSlice[],
  key: "count" | "amount",
  othersLabel: string,
): ClientSlice[] {
  const sorted = [...data].sort((a, b) => b[key] - a[key]);
  if (sorted.length <= SLICE_CAP) return sorted;
  const top = sorted.slice(0, SLICE_CAP - 1);
  const rest = sorted.slice(SLICE_CAP - 1);
  return [
    ...top,
    {
      companyId: "__others__",
      companyName: othersLabel,
      amount: rest.reduce((s, c) => s + c.amount, 0),
      count: rest.reduce((s, c) => s + c.count, 0),
    },
  ];
}

interface PiePanelProps {
  data: ClientSlice[];
  dataKey: "count" | "amount";
  label: string;
  othersLabel: string;
  formatter: (v: number) => string;
  onSliceClick: (c: ClientSlice) => void;
  divider?: boolean;
}

function PiePanel({ data, dataKey, label, othersLabel, formatter, onSliceClick, divider }: PiePanelProps) {
  const [active, setActive] = useState(-1);
  const slices = buildSlices(data, dataKey, othersLabel);
  const total = slices.reduce((s, c) => s + c[dataKey], 0);

  return (
    <div className={`p-5${divider ? " border-t border-gray-900/[0.05] sm:border-l sm:border-t-0 dark:border-white/[0.05]" : ""}`}>
      <p className="mb-1 text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">{label}</p>
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie
            data={slices}
            dataKey={dataKey}
            nameKey="companyName"
            innerRadius={54}
            outerRadius={82}
            paddingAngle={2}
            onMouseEnter={(_, index) => setActive(index)}
            onMouseLeave={() => setActive(-1)}
            onClick={(_entry, index) => {
              const c = slices[index];
              if (c && c.companyId !== "__others__") onSliceClick(c);
            }}
          >
            {slices.map((entry, index) => (
              <Cell
                key={entry.companyId}
                fill={COLORS[index % COLORS.length]}
                opacity={active === -1 || active === index ? 1 : 0.3}
                style={{
                  cursor: entry.companyId !== "__others__" ? "pointer" : "default",
                  transition: "opacity 120ms ease",
                }}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, _name, item) => {
              const val = Number(v ?? 0);
              const pct = total > 0 ? Math.round((val / total) * 100) : 0;
              const c = item.payload as ClientSlice;
              return [`${formatter(val)} · ${pct}%`, c?.companyName ?? ""];
            }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.08)",
              fontSize: 12,
              padding: "8px 12px",
            }}
            itemStyle={{ color: "#374151" }}
            labelStyle={{ display: "none" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AccountantClientDistribution() {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const [range, setRange] = useState<Range>("month");
  const [clients, setClients] = useState<ClientSlice[] | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setClients(null);
    fetch(`/api/accountant/firm/client-distribution?range=${range}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not-ok"))))
      .then((d: { clients: ClientSlice[] }) => setClients(d.clients ?? []))
      .catch((e: Error) => { if (e.name !== "AbortError") setClients([]); });
    return () => ctrl.abort();
  }, [range]);

  const rangeOptions: { value: Range; label: string }[] = [
    { value: "day",   label: t.distRangeDay },
    { value: "week",  label: t.distRangeWeek },
    { value: "month", label: t.distRangeMonth },
    { value: "3m",    label: t.distRange3m },
    { value: "6m",    label: t.distRange6m },
    { value: "year",  label: t.distRangeYear },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]"
    >
      <div className="flex items-center justify-between border-b border-gray-900/[0.07] px-5 py-4 dark:border-white/[0.07]">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.clientDistTitle}</p>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as Range)}
          className="rounded-lg border border-gray-900/[0.10] bg-white/80 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-900/20 focus:outline-none focus:ring-2 focus:ring-nordic-600/30 dark:border-white/[0.15] dark:bg-white/[0.06] dark:text-gray-300"
        >
          {rangeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {clients === null ? (
        <div className="grid grid-cols-2 divide-x divide-gray-900/[0.05] dark:divide-white/[0.05]">
          <div className="h-[238px] animate-pulse bg-gray-50 dark:bg-white/[0.03]" />
          <div className="h-[238px] animate-pulse bg-gray-50 dark:bg-white/[0.03]" />
        </div>
      ) : clients.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-gray-400">{t.clientDistEmpty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <PiePanel
            data={clients}
            dataKey="count"
            label={t.clientDistCount}
            othersLabel={t.clientDistOthers}
            formatter={(v) => `${v} ${t.distReceiptUnit}`}
            onSliceClick={(c) => router.push(`/accountant/clients/${c.companyId}`)}
          />
          <PiePanel
            data={clients}
            dataKey="amount"
            label={t.clientDistAmount}
            othersLabel={t.clientDistOthers}
            formatter={(v) => formatSek(v)}
            onSliceClick={(c) => router.push(`/accountant/clients/${c.companyId}`)}
            divider
          />
        </div>
      )}
    </motion.div>
  );
}
