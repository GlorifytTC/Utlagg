"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AccountantReceipts } from "@/components/accountant/AccountantReceipts";
import { AccountantExports } from "@/components/accountant/AccountantExports";

interface Detail {
  companyId: string;
  companyName: string;
  receiptCount: number;
}

type Tab = "overview" | "receipts" | "exports";

/**
 * Client workspace with Overview / Receipts / Exports tabs. Binds detail to
 * GET /api/accountant/clients/[id]. Handles loading / not-found (404 =
 * revoked/unauthorized/unknown, indistinguishable) / error.
 */
export function AccountantClientWorkspace({ companyId }: { companyId: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "notfound" | "error">("loading");
  const [tab, setTab] = useState<Tab>("overview");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/accountant/clients/${companyId}`);
      if (res.status === 404 || res.status === 403) {
        setStatus("notfound");
        return;
      }
      if (!res.ok) throw new Error();
      setDetail(await res.json());
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  if (status === "loading") return <p className="text-sm text-ink/50">Laddar…</p>;
  if (status === "notfound") {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="font-medium text-ink">Klienten är inte tillgänglig</p>
          <p className="mt-1 text-sm text-ink/60">
            Åtkomsten kan ha tagits bort, eller så finns klienten inte.
          </p>
        </CardContent>
      </Card>
    );
  }
  if (status === "error" || !detail) {
    return <p className="text-sm text-red-600">Kunde inte ladda klienten.</p>;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Översikt" },
    { key: "receipts", label: "Kvitton" },
    { key: "exports", label: "Export" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{detail.companyName}</h1>
        <p className="text-ink/60">{detail.receiptCount} kvitton</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-white/[0.08]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-ink text-ink"
                : "border-transparent text-ink/50 hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <Card>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-ink/50">Kvitton totalt</p>
              <p className="text-2xl font-semibold text-ink">{detail.receiptCount}</p>
            </div>
          </CardContent>
        </Card>
      )}
      {tab === "receipts" && <AccountantReceipts companyId={companyId} />}
      {tab === "exports" && <AccountantExports companyId={companyId} />}
    </div>
  );
}
