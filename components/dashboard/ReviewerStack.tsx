"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { ClientAvatar } from "@/components/accountant/ClientAvatar";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

const MAX = 3;
const RING = "ring-2 ring-[#fffefb] dark:ring-[#0d0d0d]"; // matches the panel surface

type Person = { name: string; logoUrl: string | null };

/**
 * Overlapping avatars of whoever approved a receipt (green check), then every
 * accountant who reviewed it. Replaces the green "Approved" pill, so it carries
 * the label for assistive tech and a custom hover/focus tooltip (also reachable
 * by tap and keyboard). 32px (h-8) keeps initials readable.
 */
export function ReviewerStack({
  reviewers,
  approver,
  className,
}: {
  reviewers: Person[];
  approver?: Person | null;
  className?: string;
}) {
  const { t } = useLanguage();
  const ref = useRef<HTMLSpanElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Fixed-position tooltip: the table wrapper is overflow-x-auto and would clip
  // an absolute one. Close on scroll so it never floats away from its anchor.
  useEffect(() => {
    if (!rect) return;
    const close = () => setRect(null);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [rect]);

  const others = approver ? reviewers.filter((r) => r.name !== approver.name) : reviewers;
  const people = approver ? [approver, ...others] : others;
  if (people.length === 0) return null;
  const shown = people.slice(0, MAX);
  const extra = people.length - shown.length;
  const lines = [
    approver && `${t.approvedBy} ${approver.name}`,
    others.length > 0 && `${t.reviewedBy} ${others.map((r) => r.name).join(", ")}`,
  ].filter(Boolean) as string[];
  const open = () => ref.current && setRect(ref.current.getBoundingClientRect());

  return (
    <>
      <span
        ref={ref}
        role="img"
        tabIndex={0}
        aria-label={lines.join(". ")}
        onMouseEnter={open}
        onMouseLeave={() => setRect(null)}
        onFocus={open}
        onBlur={() => setRect(null)}
        className={cn(
          "inline-flex cursor-default items-center rounded-full align-middle -space-x-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nordic-600",
          className,
        )}
      >
        {shown.map((p, i) => (
          <span key={i} className={cn("relative rounded-full", RING)}>
            <ClientAvatar name={p.name} logoUrl={p.logoUrl} size="sm" />
            {approver && i === 0 && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-600 text-white ring-2 ring-[#fffefb] dark:ring-[#0d0d0d]">
                <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
              </span>
            )}
          </span>
        ))}
        {extra > 0 && (
          <span
            className={cn(
              "flex h-8 min-w-8 items-center justify-center rounded-full bg-gray-200 px-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200",
              RING,
            )}
          >
            +{extra}
          </span>
        )}
      </span>
      {rect &&
        createPortal(
          <span
            aria-hidden
            style={{ left: rect.left + rect.width / 2, top: rect.top - 8 }}
            className="pointer-events-none fixed z-[100] max-w-[240px] -translate-x-1/2 -translate-y-full rounded-lg bg-gray-900 px-2.5 py-1.5 text-center text-xs font-medium leading-snug text-white shadow-lg dark:bg-gray-100 dark:text-gray-900"
          >
            {lines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </span>,
          document.body,
        )}
    </>
  );
}
