import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Announced error line. Pass `onRetry` + `retryLabel` for a panel with a retry button. */
export function ErrorState({
  children,
  onRetry,
  retryLabel,
  className,
}: {
  children: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  const text = (
    <p role="alert" className={cn("text-sm text-red-600 dark:text-red-400", !onRetry && className)}>
      {children}
    </p>
  );
  if (!onRetry) return text;
  return (
    <div className={cn("panel flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4", className)}>
      {text}
      <Button variant="outline" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}
