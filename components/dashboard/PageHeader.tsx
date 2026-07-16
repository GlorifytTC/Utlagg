import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Consistent dashboard page header: a small uppercase eyebrow, a display title
 * and an optional one-line description that tells the user what the page is for.
 * Renders in both server and client pages (no client hooks). Pass an `action`
 * (button/link) to anchor it to the top-right.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[9.5px] font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-gray-400">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-xl text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
