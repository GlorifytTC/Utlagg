import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatItem = {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  /** "warn" highlights a number that needs attention. */
  tone?: "default" | "warn";
};

// Column count follows the number of items, so a grid never shows empty cells.
const COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};

/** Row of key numbers in one panel, separated by hairlines. */
export function StatGrid({ items, className }: { items: StatItem[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <div
      className={cn(
        "panel grid gap-px overflow-hidden rounded-2xl bg-gray-900/[0.06] dark:bg-white/[0.06]",
        COLS[items.length] ?? "grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {items.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="panel-fill flex flex-col justify-between gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            {Icon && (
              <Icon
                className={cn("h-4 w-4 shrink-0", tone === "warn" ? "text-amber-500" : "text-gray-400 dark:text-gray-500")}
                strokeWidth={1.5}
              />
            )}
          </div>
          <p
            className={cn(
              "font-display text-3xl font-semibold leading-none tracking-tight tabular-nums",
              tone === "warn" ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white",
            )}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
