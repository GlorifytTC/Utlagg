"use client";

import { useEffect, useState, useCallback } from "react";
import { formatSek, formatDate, cn } from "@/lib/utils";
import type { Receipt } from "@/db/schema";

const STATUS_LABEL: Record<string, string> = {
  pending: "Väntar",
  approved: "Godkänd",
  rejected: "Nekad",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber/15 text-amber",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export function ReceiptTable({ refreshKey }: { refreshKey: number }) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/receipts");
      const data = await res.json();
      setReceipts(data.receipts ?? []);
    } catch {
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <div className="rounded-2xl border hairline bg-white/60">
      <div className="flex items-center justify-between border-b hairline p-5">
        <h2 className="font-display text-xl">Kvitton</h2>
        <a
          href="/api/export/csv"
          className="rounded-full border hairline px-4 py-2 text-sm hover:border-ink/40"
        >
          Exportera CSV
        </a>
      </div>

      {loading ? (
        <p className="p-8 text-center text-sm text-ink/50">Laddar…</p>
      ) : receipts.length === 0 ? (
        <p className="p-10 text-center text-sm text-ink/50">
          Inga kvitton ännu. Ladda upp ditt första ovan.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink/45">
                <th className="px-5 py-3 font-medium">Datum</th>
                <th className="px-5 py-3 font-medium">Leverantör</th>
                <th className="px-5 py-3 font-medium">BAS</th>
                <th className="px-5 py-3 font-medium">Moms</th>
                <th className="px-5 py-3 font-medium">Belopp</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.id} className="border-t hairline hover:bg-paper/50">
                  <td className="px-5 py-3">{formatDate(r.date)}</td>
                  <td className="px-5 py-3 font-medium">{r.vendorName ?? "—"}</td>
                  <td className="px-5 py-3 font-mono text-ink/70">{r.basCode ?? "—"}</td>
                  <td className="px-5 py-3">
                    {r.vatRate ? `${r.vatRate}%` : "—"}{" "}
                    <span className="text-ink/40">{formatSek(r.vatAmount)}</span>
                  </td>
                  <td className="px-5 py-3">{formatSek(r.totalAmount)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        STATUS_STYLE[r.status],
                      )}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
