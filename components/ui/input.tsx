import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-xl border border-gray-900/15 bg-white px-3.5 py-2 text-sm text-gray-900 transition placeholder:text-gray-500 focus:border-nordic-600 focus:outline-none focus:ring-4 focus:ring-nordic-600/15 disabled:opacity-50 dark:border-white/[0.14] dark:bg-[#0d0d0d] dark:text-white dark:placeholder:text-gray-500",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
