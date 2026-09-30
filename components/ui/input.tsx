import * as React from "react";
import { cn } from "@/lib/utils";

/** Shared field look for every text-like control, so inputs, selects and textareas match. */
export const fieldClass =
  "w-full rounded-xl border border-gray-900/15 bg-white px-3.5 text-base text-gray-900 md:text-sm transition placeholder:text-gray-500 focus:border-nordic-600 focus:outline-none focus:ring-4 focus:ring-nordic-600/15 disabled:opacity-50 dark:border-white/[0.14] dark:bg-[#0d0d0d] dark:text-white dark:placeholder:text-gray-500";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldClass, "flex h-11 py-2 md:h-10", className)} {...props} />
));
Input.displayName = "Input";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(fieldClass, "h-11 md:h-10", className)} {...props} />
));
Select.displayName = "Select";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldClass, "py-2", className)} {...props} />
));
Textarea.displayName = "Textarea";
