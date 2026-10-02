"use client";

import { ClientAvatar } from "@/components/accountant/ClientAvatar";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

const MAX = 3;
const RING = "ring-2 ring-[#fffefb] dark:ring-[#0d0d0d]"; // matches the panel surface

/**
 * Overlapping avatars of every accountant who reviewed a receipt. Replaces the
 * green "Approved" pill, so it carries the label for assistive tech and hover.
 * 24px (h-6) matches the pill's height, so rows don't grow.
 */
export function ReviewerStack({
  reviewers,
  className,
}: {
  reviewers: { name: string; logoUrl: string | null }[];
  className?: string;
}) {
  const { t } = useLanguage();
  if (reviewers.length === 0) return null;
  const shown = reviewers.slice(0, MAX);
  const extra = reviewers.length - shown.length;
  const label = `${t.reviewedBy} ${reviewers.map((r) => r.name).join(", ")}`;
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn("inline-flex items-center -space-x-1.5", className)}
    >
      {shown.map((r, i) => (
        <span key={i} className={cn("rounded-full", RING)}>
          <ClientAvatar name={r.name} logoUrl={r.logoUrl} size="xs" />
        </span>
      ))}
      {extra > 0 && (
        <span
          className={cn(
            "flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-200 px-1 text-[10px] font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200",
            RING,
          )}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}
