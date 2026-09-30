import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Title row for app pages: optional back link, heading, one-line subtitle, actions on the right. */
export function PageHeader({
  title,
  subtitle,
  actions,
  back,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: React.ReactNode };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="mb-3 -my-2 inline-flex min-h-11 items-center gap-1.5 rounded-full text-sm text-gray-500 transition duration-300 ease-premium hover:text-gray-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            {back.label}
          </Link>
        )}
        <h1 className="break-words font-display text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl md:text-[2rem]">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 max-sm:[&>*]:flex-1">{actions}</div>}
    </div>
  );
}
