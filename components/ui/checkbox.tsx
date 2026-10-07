import * as React from "react";
import { cn } from "@/lib/utils";

/** Checkbox + label with a 44px hit area on mobile. Native input keeps the brand accent-color from globals.css. */
export const Checkbox = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { label: React.ReactNode; labelClassName?: string }
>(({ label, className, labelClassName, ...props }, ref) => (
  <label
    className={cn(
      "inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-gray-700 md:min-h-0 dark:text-gray-300",
      props.disabled && "cursor-not-allowed opacity-50",
      labelClassName,
    )}
  >
    <input ref={ref} type="checkbox" className={cn("shrink-0 rounded", className)} {...props} />
    <span>{label}</span>
  </label>
));
Checkbox.displayName = "Checkbox";
