import * as React from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/** Selectable card with a native checkbox (a11y + keyboard for free). */
export function CheckCard({
  icon,
  title,
  description,
  locked,
  lockedLabel,
  className,
  children,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "title"> & {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  locked?: boolean;
  lockedLabel?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-900/15 bg-white transition duration-300 ease-premium dark:border-white/[0.14] dark:bg-[#0d0d0d]",
        "has-[:checked]:border-nordic-600 has-[:checked]:bg-nordic-50 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-nordic-600/15",
        locked && "opacity-70",
        className,
      )}
    >
      <label className={cn("flex min-h-11 items-start gap-3 p-4", locked ? "cursor-not-allowed" : "cursor-pointer")}>
        <input type="checkbox" disabled={locked || props.disabled} className="mt-0.5 h-5 w-5 shrink-0" {...props} />
        {icon && <span className="mt-0.5 text-gray-500 dark:text-gray-400">{icon}</span>}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
            {title}
            {locked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-900/[0.06] px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
                <Lock className="h-3 w-3" strokeWidth={2} />
                {lockedLabel}
              </span>
            )}
          </span>
          {description && <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{description}</span>}
        </span>
      </label>
      {children && <div className="px-4 pb-4 sm:pl-[3.25rem]">{children}</div>}
    </div>
  );
}
