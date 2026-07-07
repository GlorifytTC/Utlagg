import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Kvittino brand mark — a rounded-square badge in the terracotta accent holding a
 * cream receipt silhouette (torn-perforation bottom edge) with three printed line
 * bars. Badge fills with the accent and the receipt takes the surface colour, both
 * theme-aware via Tailwind `fill-*` utilities so the mark works on paper and AMOLED.
 *
 * The `.dark` class lives on `<html>` globally, so pages that force a light surface
 * (landing, login, register) would otherwise pick up the AMOLED receipt fill when the
 * viewer's theme is dark. Pass `adaptive={false}` on those pages to pin the mark to its
 * light appearance regardless of the global theme.
 */
export function LogoMark({
  size = 32,
  className,
  adaptive = true,
}: {
  size?: number;
  className?: string;
  adaptive?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Kvittino"
      className={className}
    >
      <rect x="2" y="2" width="28" height="28" rx="8" className="fill-nordic-600" />
      {/* Receipt body — cream on paper, true-black on AMOLED (only when adaptive) */}
      <path
        d="M9 8h14v13l-2.3-1.8L18.4 21l-2.3-1.8L13.8 21l-2.3-1.8L9 21z"
        className={cn("fill-paper", adaptive && "dark:fill-[#050505]")}
      />
      {/* Printed line items, in the accent showing through the receipt */}
      <rect x="12" y="11.5" width="8" height="1.6" rx="0.8" className="fill-nordic-600" />
      <rect x="12" y="14.7" width="8" height="1.6" rx="0.8" className="fill-nordic-600" />
      <rect x="12" y="17.9" width="5" height="1.6" rx="0.8" className="fill-nordic-600" />
    </svg>
  );
}

/**
 * Full lockup: badge + "Kvittino" wordmark (sentence case, weight 800).
 */
export function Logo({
  size = 32,
  className,
  wordmarkClassName,
  adaptive = true,
}: {
  size?: number;
  className?: string;
  wordmarkClassName?: string;
  adaptive?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} adaptive={adaptive} />
      <span
        className={cn(
          "font-display font-extrabold tracking-tight",
          wordmarkClassName,
        )}
      >
        Kvittino
      </span>
    </span>
  );
}
