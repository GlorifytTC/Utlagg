"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TIER_LABEL: Record<string, string> = { free: "Gratis", pro: "Pro", business: "Företag", enterprise: "Enterprise" };
const TICK = { fontSize: 12, fill: "currentColor" };

const COLORS = ["#E2734A", "#C4522F", "#D98A37", "#8F3418"];

export function PlanPie({ byTier }: { byTier: Record<string, number> }) {
  const data = Object.entries(byTier)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: TIER_LABEL[name] ?? name, value }));
  if (data.length === 0) return <p className="text-sm text-gray-500 dark:text-gray-400">Ingen data.</p>;
  return (
    <div role="img" aria-label={`Fördelning per plan: ${data.map((d) => `${d.name} ${d.value}`).join(", ")}`} className="text-gray-500 dark:text-gray-400">
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label={{ fill: "currentColor", fontSize: 12 }}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
    </div>
  );
}

export function MonthlyBars({
  data,
  label,
}: {
  data: { month: string; count: number }[];
  label: string;
}) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-500 dark:text-gray-400">Ingen data.</p>;
  return (
    <div role="img" aria-label={`${label} per månad: ${data.map((d) => `${d.month} ${d.count}`).join(", ")}`} className="text-gray-500 dark:text-gray-400">
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <XAxis dataKey="month" tick={TICK} />
        <YAxis allowDecimals={false} tick={TICK} />
        <Tooltip />
        <Bar dataKey="count" name={label} fill="#C4522F" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
    </div>
  );
}
