import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  danger: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  accent: "bg-nordic-50 text-nordic-700 dark:text-nordic-400",
  neutral: "bg-gray-900/[0.05] text-gray-700 dark:bg-white/[0.08] dark:text-gray-300",
};

export type BadgeTone = keyof typeof tones;

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone && tones[tone],
        className,
      )}
      {...props}
    />
  );
}
