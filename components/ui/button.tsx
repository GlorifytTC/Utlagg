import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "destructive" | "ghost";

const variants: Record<Variant, string> = {
  // dark accent is light (#E2734A): white text fails contrast there
  default: "bg-nordic-600 text-white hover:bg-nordic-700 dark:text-[#050505]",
  outline:
    "border border-gray-900/15 bg-transparent hover:border-gray-900/30 hover:bg-gray-900/[0.03] dark:border-white/[0.14] dark:text-white dark:hover:border-white/30 dark:hover:bg-white/[0.06]",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  ghost: "hover:bg-gray-900/[0.05] dark:hover:bg-white/[0.07] dark:text-white",
};

const base =
  "inline-flex items-center justify-center gap-2 min-h-11 rounded-full px-4 py-2 md:min-h-0 text-sm font-medium transition duration-300 ease-premium active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 disabled:pointer-events-none disabled:opacity-50";

/** Button look for links, so a download/nav link never has to wrap a <button>. */
export function buttonClass(variant: Variant = "default", className?: string) {
  return cn(base, variants[variant], className);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={buttonClass(variant, className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
