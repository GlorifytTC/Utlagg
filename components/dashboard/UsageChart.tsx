import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getT } from "@/lib/i18n-server";

export function UsageChart({
  used,
  limit,
}: {
  used: number;
  limit: number; // -1 = unlimited
}) {
  const t = getT();
  const unlimited = limit === -1;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));

  return (
    <Card className="rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm transition-shadow hover:shadow-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-lg text-gray-900 dark:text-white">
          {t.scansThisMonth}
        </CardTitle>
        <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
          {unlimited
            ? t.usageUnlimitedPlan
            : `${used} ${t.usageOf} ${limit} ${t.usageUsedWord}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {unlimited ? (
          <p className="text-3xl font-semibold text-nordic-600 dark:text-nordic-600">
            {used}
          </p>
        ) : (
          <div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.08]">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  pct >= 100
                    ? "bg-red-500"
                    : pct >= 80
                    ? "bg-amber-500"
                    : "bg-nordic-600"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {pct}% {t.usagePercentUsed}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}