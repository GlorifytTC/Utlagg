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

const COLORS = ["#E2734A", "#C4522F", "#D98A37", "#8F3418"];

export function PlanPie({ byTier }: { byTier: Record<string, number> }) {
  const data = Object.entries(byTier)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));
  if (data.length === 0) return <p className="text-sm text-gray-500">Ingen data.</p>;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MonthlyBars({
  data,
  label,
}: {
  data: { month: string; count: number }[];
  label: string;
}) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-500">Ingen data.</p>;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" name={label} fill="#C4522F" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
