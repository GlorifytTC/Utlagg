"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Overview stat cards for the accountant dashboard. Every number is REAL,
 * derived from existing endpoints:
 *   - active clients:  GET /api/accountant/clients (total)
 *   - pending requests: GET /api/accountant/connection-requests (pending count)
 *   - opportunities:   GET /api/accountant/discover/companies (discoverable count)
 * No fabricated metrics.
 */
export function AccountantOverview() {
  const [clients, setClients] = useState<number | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [opportunities, setOpportunities] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, r, d] = await Promise.all([
          fetch("/api/accountant/clients").then((x) => (x.ok ? x.json() : null)),
          fetch("/api/accountant/connection-requests").then((x) => (x.ok ? x.json() : null)),
          fetch("/api/accountant/discover/companies").then((x) => (x.ok ? x.json() : null)),
        ]);
        if (cancelled) return;
        setClients(c?.total ?? 0);
        setPending(
          (r?.requests ?? []).filter((x: { status: string }) => x.status === "pending").length,
        );
        setOpportunities(d?.companies?.length ?? 0);
      } catch {
        /* leave nulls → dashes */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    { label: "Aktiva klienter", value: clients },
    { label: "Väntande förfrågningar", value: pending },
    { label: "Företag söker revisor", value: opportunities },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-5">
            <p className="text-sm text-ink/50">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{s.value ?? "—"}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
