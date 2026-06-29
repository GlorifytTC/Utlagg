import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nordic-400 disabled:opacity-50 dark:border-white/[0.12] dark:bg-[#111] dark:text-white dark:placeholder:text-gray-600",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
