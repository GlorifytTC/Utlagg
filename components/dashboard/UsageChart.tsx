import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function UsageChart({
  used,
  limit,
}: {
  used: number;
  limit: number; // -1 = unlimited
}) {
  const unlimited = limit === -1;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Skanningar denna månad</CardTitle>
        <CardDescription>
          {unlimited ? "Obegränsat i din plan" : `${used} av ${limit} använda`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {unlimited ? (
          <p className="text-3xl font-semibold text-nordic-600 dark:text-nordic-400">{used}</p>
        ) : (
          <>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={
                  "h-full rounded-full transition-all " +
                  (pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber" : "bg-nordic-600")
                }
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{pct}% använt</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
