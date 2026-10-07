import { cn } from "@/lib/utils";

/** Segmented tab pills for admin lists. Scrolls sideways on narrow screens. */
export function AdminTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { key: T; label: string }[];
  value: T;
  onChange: (k: T) => void;
  label: string;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div role="tablist" aria-label={label} className="panel inline-flex gap-1 rounded-full p-1">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            type="button"
            role="tab"
            aria-selected={value === tb.key}
            onClick={() => onChange(tb.key)}
            className={cn(
              "min-h-11 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition duration-300 ease-premium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 md:min-h-0 md:py-2.5",
              value === tb.key
                ? "bg-nordic-600 text-white dark:text-[#050505]"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white",
            )}
          >
            {tb.label}
          </button>
        ))}
      </div>
    </div>
  );
}
