import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Prev / next buttons with a page indicator. Buttons only; callers own the labels. */
export function Pager({
  page,
  pageCount,
  onChange,
  prevLabel,
  nextLabel,
  status,
  className,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  prevLabel: string;
  nextLabel: string;
  /** e.g. "2 / 5" */
  status?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className={buttonClass("outline")}>
        {prevLabel}
      </button>
      <span aria-live="polite" className="text-sm tabular-nums text-gray-500 dark:text-gray-400">
        {status ?? `${page} / ${pageCount}`}
      </span>
      <button type="button" disabled={page >= pageCount} onClick={() => onChange(page + 1)} className={buttonClass("outline")}>
        {nextLabel}
      </button>
    </div>
  );
}
