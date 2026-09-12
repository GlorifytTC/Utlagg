"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RequestRow {
  id: string;
  companyId: string;
  companyName: string;
  status: "pending" | "active" | "revoked";
  createdAt: string;
  respondedAt: string | null;
}

const statusBadge: Record<string, { label: string; cls: string }> = {
  pending: { label: "Väntar", cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
  active: { label: "Accepterad", cls: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300" },
  revoked: { label: "Avböjd", cls: "bg-gray-100 text-gray-600 dark:bg-white/[0.08] dark:text-gray-300" },
};

/**
 * The accountant's incoming connection requests. Binds to
 * GET /api/accountant/connection-requests and POSTs accept/decline. Pending
 * rows get action buttons; answered rows show their status.
 */
export function AccountantRequests() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/accountant/connection-requests");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.requests ?? []);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function respond(id: string, action: "accept" | "decline") {
    setBusy(id);
    try {
      const res = await fetch(`/api/accountant/connection-requests/${id}/${action}`, { method: "POST" });
      if (res.ok) await load();
    } finally {
      setBusy(null);
    }
  }

  if (status === "loading") return <p className="text-sm text-ink/50">Laddar…</p>;
  if (status === "error") return <p className="text-sm text-red-600">Kunde inte ladda förfrågningar.</p>;
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-ink/60">
          Inga förfrågningar just nu.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
        {rows.map((r) => {
          const s = statusBadge[r.status] ?? statusBadge.revoked;
          return (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="font-medium text-ink">{r.companyName}</p>
                <p className="text-xs text-ink/50">{r.createdAt?.slice(0, 10)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={s.cls}>{s.label}</Badge>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <Button disabled={busy === r.id} onClick={() => respond(r.id, "accept")}>
                      Acceptera
                    </Button>
                    <Button variant="outline" disabled={busy === r.id} onClick={() => respond(r.id, "decline")}>
                      Avböj
                    </Button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
