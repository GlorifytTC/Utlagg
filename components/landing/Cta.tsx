"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { reveal } from "./motion";

type Variant = "primary" | "ghost" | "light";

const shell: Record<Variant, string> = {
  primary: "bg-nordic-600 text-white hover:bg-nordic-700",
  ghost: "border border-ink/15 text-ink hover:border-ink/40",
  light: "bg-paper text-ink hover:bg-white",
};
const knob: Record<Variant, string> = {
  primary: "bg-white/15",
  ghost: "bg-ink/5",
  light: "bg-ink/5",
};

/** Pill link with the arrow nested in its own circle (button-in-button). */
export function CtaLink({
  href,
  children,
  variant = "primary",
  arrow = variant !== "ghost",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  arrow?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex max-w-full items-center gap-3 whitespace-normal rounded-full text-sm font-medium transition duration-500 ease-premium active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20",
        arrow ? "py-1.5 pl-6 pr-1.5" : "px-6 py-3.5",
        shell[variant],
        className,
      )}
    >
      {children}
      {arrow && (
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-full transition duration-500 ease-premium group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105",
            knob[variant],
          )}
        >
          <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
        </span>
      )}
    </Link>
  );
}

/** Closing call to action shared by the marketing pages. */
export function CtaPanel({
  title,
  body,
  href,
  label,
  note,
}: {
  title: string;
  body: string;
  href: string;
  label: string;
  note?: string;
}) {
  const rm = useReducedMotion();
  return (
    <section className="mx-auto max-w-6xl 2xl:max-w-7xl px-6 py-24 md:py-32">
      <motion.div
        {...reveal(0, rm)}
        className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-14 text-paper sm:px-8 md:px-16 md:py-20"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgb(var(--accent)/0.35),transparent_70%)]"
        />
        <div className="relative grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <h2 className="max-w-xl break-words font-display text-3xl font-semibold leading-[1.1] tracking-tight hyphens-auto sm:text-4xl md:text-5xl">
              {title}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-paper/65">{body}</p>
          </div>
          <div className="md:justify-self-end">
            <CtaLink href={href} variant="light">
              {label}
            </CtaLink>
            {note && <p className="mt-4 text-xs text-paper/65">{note}</p>}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
