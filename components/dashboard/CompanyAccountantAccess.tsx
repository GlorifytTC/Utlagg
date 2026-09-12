"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AccountantRow {
  relationshipId: string;
  accountantId: string;
  name: string | null;
  email: string;
  status: string;
  connectedAt: string | null;
}

/**
 * Company settings section listing accountants with ACTIVE access, with a
 * revoke action. Binds to GET /api/company/accountants and the existing
 * POST /api/company/accountants/[accountantId]/revoke. Matches the company
 * page's card/list/red-action styling.
 */
export function CompanyAccountantAccess() {
  const [rows, setRows] = useState<AccountantRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/company/accountants");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.accountants ?? []);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function revoke(accountantId: string) {
    setBusy(accountantId);
    try {
      const res = await fetch(`/api/company/accountants/${accountantId}/revoke`, { method: "POST" });
      if (res.ok) {
        toast.success("Åtkomst borttagen");
        // Remove immediately, then refresh from the server.
        setRows((prev) => prev.filter((r) => r.accountantId !== accountantId));
        setConfirmId(null);
        load();
      } else {
        toast.error("Kunde inte ta bort åtkomst");
      }
    } catch {
      toast.error("Kunde inte ta bort åtkomst");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revisorsåtkomst</CardTitle>
        <CardDescription>Revisorer som har åtkomst till företagets kvitton.</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "loading" ? (
          <p className="text-sm text-gray-500">Laddar…</p>
        ) : status === "error" ? (
          <p className="text-sm text-red-600">Kunde inte ladda revisorer.</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">Ingen revisor har åtkomst just nu.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.07]">
            {rows.map((a) => (
              <li key={a.relationshipId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">{a.name ?? a.email}</p>
                  <p className="text-xs text-gray-500">{a.email}</p>
                </div>
                {confirmId === a.accountantId ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Ta bort åtkomst?</span>
                    <Button
                      variant="destructive"
                      disabled={busy === a.accountantId}
                      onClick={() => revoke(a.accountantId)}
                    >
                      {busy === a.accountantId ? "Tar bort…" : "Ja, ta bort"}
                    </Button>
                    <Button variant="outline" onClick={() => setConfirmId(null)}>
                      Avbryt
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(a.accountantId)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Ta bort åtkomst
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
