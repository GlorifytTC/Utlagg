import { ClientAvatar } from "@/components/accountant/ClientAvatar";
import { cn } from "@/lib/utils";

const MAX = 3;

/** Overlapping avatars of every accountant who reviewed a receipt. */
export function ReviewerStack({
  reviewers,
  className,
}: {
  reviewers: { name: string; logoUrl: string | null }[];
  className?: string;
}) {
  if (reviewers.length === 0) return null;
  const shown = reviewers.slice(0, MAX);
  const extra = reviewers.length - shown.length;
  return (
    <div
      className={cn("flex -space-x-2", className)}
      title={reviewers.map((r) => r.name).join(", ")}
    >
      {shown.map((r, i) => (
        <span key={i} className="rounded-full ring-2 ring-white dark:ring-gray-900">
          <ClientAvatar name={r.name} logoUrl={r.logoUrl} size="sm" />
        </span>
      ))}
      {extra > 0 && (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium ring-2 ring-white dark:bg-gray-700 dark:ring-gray-900">
          +{extra}
        </span>
      )}
    </div>
  );
}
