import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "destructive" | "ghost";

const variants: Record<Variant, string> = {
  default: "bg-nordic-600 text-white hover:bg-nordic-900",
  outline:
    "border border-gray-300 bg-transparent hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  ghost: "hover:bg-gray-100 dark:hover:bg-gray-800",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
