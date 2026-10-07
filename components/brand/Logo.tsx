import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Kvittino brand mark - a rounded-square badge in the terracotta accent holding a
 * tilted cream receipt (torn-perforation bottom edge) with a smiling face printed on it.
 * Badge fills with the accent and the receipt takes the surface colour, both theme-aware via Tailwind `fill-*` utilities so the mark works on paper and AMOLED.
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
  decorative = false,
}: {
  size?: number;
  className?: string;
  adaptive?: boolean;
  /** Hide from assistive tech when the wordmark is rendered next to it. */
  decorative?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": "Kvittino" })}
      className={className}
    >
      <rect x="2" y="2" width="28" height="28" rx="8" className="fill-nordic-600" />
      <g transform="rotate(-6 16 16)">
        {/* Receipt body - cream on paper, true-black on AMOLED (only when adaptive) */}
        <path
          d="M8.5 7h15v16.5l-1.875-1.5-1.875 1.5-1.875-1.5-1.875 1.5-1.875-1.5-1.875 1.5-1.875-1.5-1.875 1.5z"
          className={cn("fill-paper", adaptive && "dark:fill-[#050505]")}
        />
        {/* Printed header bar, eyes and smile, in the accent showing through */}
        <rect x="12.25" y="9.25" width="7.5" height="1.125" rx="0.5625" className="fill-nordic-600" />
        <circle cx="12.875" cy="13.25" r="1.25" className="fill-nordic-600" />
        <circle cx="19.125" cy="13.25" r="1.25" className="fill-nordic-600" />
        <path
          d="M12.25 16.9q3.75 3.5 7.5 0"
          fill="none"
          strokeWidth="1.625"
          strokeLinecap="round"
          className="stroke-nordic-600"
        />
      </g>
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
      <LogoMark size={size} adaptive={adaptive} decorative />
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
