"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatSek } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { Palette } from "lucide-react";

type Range = "month" | "year";
type Bucket = "food" | "travel" | "office" | "it" | "marketing" | "professional" | "other";

interface TrendPoint {
  bucket: string;
  amount: number;
  count: number;
}
interface CategoryPoint {
  bucket: Bucket;
  amount: number;
  count: number;
}
interface Overview {
  range: Range;
  trend: TrendPoint[];
  categories: CategoryPoint[];
  kpi: {
    totalAmount: number;
    totalVat: number;
    count: number;
    avgPerReceipt: number;
    topCategory: { bucket: Bucket; amount: number } | null;
  };
}

const BUCKET_KEYS: Record<Bucket, string> = {
  food: "stBucketFood",
  travel: "stBucketTravel",
  office: "stBucketOffice",
  it: "stBucketIt",
  marketing: "stBucketMarketing",
  professional: "stBucketProfessional",
  other: "stBucketOther",
};

// A few distinct, vivid palettes — deliberately livelier than the rest of
// the app's restrained nordic theme, since this page only is meant to feel
// like a colorful BI dashboard. Stored client-side (no account-wide effect).
const THEMES: Record<string, { name: string; colors: string[] }> = {
  // Default: warm terracotta-led palette matching the Kvittino brand accent
  // (#C4522F). Leads with the brand color, then warm/earthy supporting hues.
  terracotta: {
    name: "Terrakotta",
    colors: ["#C4522F", "#E08A3C", "#D9A441", "#8C6A4A", "#C77B6B", "#B8894F", "#B0A69A"],
  },
  ocean: {
    name: "Ocean",
    colors: ["#005F73", "#0A9396", "#94D2BD", "#EE9B00", "#CA6702", "#BB3E03", "#6C757D"],
  },
  sunset: {
    name: "Sunset",
    colors: ["#FF6B35", "#F7C59F", "#EFEFD0", "#004E89", "#1A659E", "#7D80DA", "#A0A0A0"],
  },
  forest: {
    name: "Forest",
    colors: ["#2D6A4F", "#40916C", "#74C69D", "#B7E4C7", "#D4A373", "#9C6644", "#83878B"],
  },
};
const THEME_STORAGE_KEY = "utlagg_stats_theme";

export function StatsClient() {
  const { t, lang } = useLanguage();
  // Localised month names for the picker (Januari… / January…). Built from
  // Intl so we never have to hand-maintain 12 translation keys per language.
  const monthNames = useMemo(() => {
    const locale = lang === "en" ? "en-US" : "sv-SE";
    const fmt = new Intl.DateTimeFormat(locale, { month: "long" });
    return Array.from({ length: 12 }, (_, i) => {
      const name = fmt.format(new Date(2020, i, 1));
      return name.charAt(0).toUpperCase() + name.slice(1);
    });
  }, [lang]);
  const now = new Date();
  const [mode, setMode] = useState<Range>("month");
  const [selMonth, setSelMonth] = useState<number>(now.getMonth()); // 0-11
  const [selYear, setSelYear] = useState<number>(now.getFullYear());
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [themeKey, setThemeKey] = useState<keyof typeof THEMES>("terracotta");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && saved in THEMES) setThemeKey(saved as keyof typeof THEMES);
  }, []);

  function chooseTheme(key: keyof typeof THEMES) {
    setThemeKey(key);
    window.localStorage.setItem(THEME_STORAGE_KEY, key);
    setPickerOpen(false);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs =
      mode === "month"
        ? `month=${selYear}-${String(selMonth + 1).padStart(2, "0")}`
        : `year=${selYear}`;
    fetch(`/api/stats/overview?${qs}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, selMonth, selYear]);

  const theme = THEMES[themeKey];

  const pieData = useMemo(
    () =>
      (data?.categories ?? []).map((c, i) => ({
        name: t[BUCKET_KEYS[c.bucket] as keyof typeof t] as string,
        value: c.amount,
        count: c.count,
        color: theme.colors[i % theme.colors.length],
      })),
    [data, theme, t],
  );

  const totalCategoryAmount = pieData.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.navStats}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t.stSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Month / Year mode toggle */}
          <div className="flex rounded-full border border-gray-200 bg-white p-1 dark:border-white/[0.08] dark:bg-[#111]">
            {(["month", "year"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setMode(r)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  mode === r
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {r === "month" ? t.stRangeMonth : t.stRangeYear}
              </button>
            ))}
          </div>

          {/* Month-name picker (only in month mode) */}
          {mode === "month" && (
            <select
              value={selMonth}
              onChange={(e) => setSelMonth(Number(e.target.value))}
              className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-900 dark:border-white/[0.08] dark:bg-[#111] dark:text-white"
            >
              {monthNames.map((name, i) => (
                <option key={i} value={i}>
                  {name}
                </option>
              ))}
            </select>
          )}

          {/* Year picker */}
          <select
            value={selYear}
            onChange={(e) => setSelYear(Number(e.target.value))}
            className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-900 dark:border-white/[0.08] dark:bg-[#111] dark:text-white"
          >
            {Array.from({ length: 6 }, (_, i) => now.getFullYear() - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          {/* Theme picker */}
          <div className="relative">
            <button
              onClick={() => setPickerOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-300 dark:border-white/[0.08] dark:bg-[#111] dark:text-gray-200"
            >
              <Palette className="h-4 w-4" />
              {theme.name}
            </button>
            {pickerOpen && (
              <div className="absolute right-0 z-10 mt-2 w-44 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-white/[0.08] dark:bg-[#111]">
                <p className="px-2 pb-1 pt-1 text-xs font-medium text-gray-400">{t.stTheme}</p>
                {Object.entries(THEMES).map(([key, th]) => (
                  <button
                    key={key}
                    onClick={() => chooseTheme(key as keyof typeof THEMES)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      key === themeKey ? "bg-gray-50 dark:bg-white/[0.08]" : ""
                    }`}
                  >
                    <span className="flex gap-0.5">
                      {th.colors.slice(0, 4).map((c, i) => (
                        <span key={i} className="h-3 w-3 rounded-full" style={{ background: c }} />
                      ))}
                    </span>
                    {th.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col overflow-hidden border-0" style={{ background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[0]}cc)` }}>
          <CardContent className="flex flex-1 flex-col justify-center p-5 pt-5 text-white">
            <p className="text-sm opacity-90">{t.statTotalAmount}</p>
            <p className="mt-1 text-3xl font-bold">{formatSek(data?.kpi.totalAmount ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="flex flex-col overflow-hidden border-0" style={{ background: `linear-gradient(135deg, ${theme.colors[1]}, ${theme.colors[1]}cc)` }}>
          <CardContent className="flex flex-1 flex-col justify-center p-5 pt-5 text-white">
            <p className="text-sm opacity-90">{t.statTotalReceipts}</p>
            <p className="mt-1 text-3xl font-bold">{data?.kpi.count ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="flex flex-col overflow-hidden border-0" style={{ background: `linear-gradient(135deg, ${theme.colors[2]}, ${theme.colors[2]}cc)` }}>
          <CardContent className="flex flex-1 flex-col justify-center p-5 pt-5 text-white">
            <p className="text-sm opacity-90">{t.stAvgPerReceipt}</p>
            <p className="mt-1 text-3xl font-bold">{formatSek(data?.kpi.avgPerReceipt ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="flex flex-col overflow-hidden border-0" style={{ background: `linear-gradient(135deg, ${theme.colors[3]}, ${theme.colors[3]}cc)` }}>
          <CardContent className="flex flex-1 flex-col justify-center p-5 pt-5 text-white">
            <p className="text-sm opacity-90">{t.stTopCategory}</p>
            <p className="mt-1 truncate text-2xl font-bold">
              {data?.kpi.topCategory ? (t[BUCKET_KEYS[data.kpi.topCategory.bucket] as keyof typeof t] as string) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Trend chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{t.stTrend}</CardTitle>
            <CardDescription>
              {mode === "month" ? `${monthNames[selMonth]} ${selYear}` : selYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-72 items-center justify-center text-sm text-gray-400">…</div>
            ) : !data || data.trend.length === 0 ? (
              <div className="flex h-72 items-center justify-center text-sm text-gray-400">{t.stNoData}</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip
                    formatter={(value) => formatSek(Number(value))}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} fill={theme.colors[0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category donut */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t.stByCategory}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-72 items-center justify-center text-sm text-gray-400">…</div>
            ) : pieData.length === 0 ? (
              <div className="flex h-72 items-center justify-center text-sm text-gray-400">{t.stNoCategoryData}</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {pieData.map((p, i) => (
                      <Cell key={i} fill={p.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatSek(Number(value))} contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }} />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category ranking bars */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.stByCategory}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pieData
              .slice()
              .sort((a, b) => b.value - a.value)
              .map((p) => {
                const pct = totalCategoryAmount > 0 ? (p.value / totalCategoryAmount) * 100 : 0;
                return (
                  <div key={p.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-200">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                        {p.name}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatSek(p.value)} · {pct.toFixed(0)}% {t.stShareOfTotal}
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.08]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: p.color }}
                      />
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5 pt-5">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.stTotalVat}</p>
            <p className="text-xl font-semibold">{formatSek(data?.kpi.totalVat ?? 0)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
