"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Side = "top" | "bottom" | "left" | "right";

// Purely CSS-driven (group-hover / focus-within) so it stays SSR-safe and needs
// no positioning JS. Appears on hover *and* keyboard focus for accessibility.
const sideClasses: Record<Side, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export function Tooltip({
  label,
  children,
  side = "top",
  wide = false,
  className,
}: {
  /** Hover/focus text. */
  label: ReactNode;
  children: ReactNode;
  side?: Side;
  /** Allow the bubble to wrap for longer, explanatory copy. */
  wide?: boolean;
  className?: string;
}) {
  if (!label) return <>{children}</>;

  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium leading-snug text-white shadow-lg ring-1 ring-black/5",
          "scale-95 opacity-0 transition duration-150 ease-out",
          "group-hover/tt:scale-100 group-hover/tt:opacity-100 group-focus-within/tt:scale-100 group-focus-within/tt:opacity-100",
          "dark:bg-white dark:text-gray-900 dark:ring-white/10",
          wide ? "w-max max-w-[220px] whitespace-normal text-center" : "whitespace-nowrap",
          sideClasses[side],
          className,
        )}
      >
        {label}
      </span>
    </span>
  );
}
