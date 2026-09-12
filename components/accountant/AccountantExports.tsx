"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ExportRow {
  id: string;
  fromDate: string | null;
  toDate: string | null;
  format: string;
  receiptCount: number;
  createdAt: string;
}

/**
 * Export panel for a client. POSTs to /api/accountant/clients/[id]/export
 * (format csv|sie + optional from/to), triggers a file download, and lists
 * history from GET /api/accountant/clients/[id]/exports. CSV + SIE only.
 */
export function AccountantExports({ companyId }: { companyId: string }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState<"csv" | "sie" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [history, setHistory] = useState<ExportRow[]>([]);
  const [histStatus, setHistStatus] = useState<"loading" | "ok" | "error">("loading");

  const loadHistory = useCallback(async () => {
    setHistStatus("loading");
    try {
      const res = await fetch(`/api/accountant/clients/${companyId}/exports`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHistory(data.exports ?? []);
      setHistStatus("ok");
    } catch {
      setHistStatus("error");
    }
  }, [companyId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function doExport(format: "csv" | "sie") {
    setBusy(format);
    setErr(null);
    try {
      const res = await fetch(`/api/accountant/clients/${companyId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, from: from || undefined, to: to || undefined }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d?.error ?? "Exporten misslyckades.");
        return;
      }
      // Stream the file to a download.
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "csv" ? "kvitton.csv" : "kvittino.se";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      loadHistory();
    } catch {
      setErr("Exporten misslyckades.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-ink/50">Från</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink/50">Till</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <Button onClick={() => doExport("csv")} disabled={busy !== null}>
              {busy === "csv" ? "Exporterar…" : "Exportera CSV"}
            </Button>
            <Button variant="outline" onClick={() => doExport("sie")} disabled={busy !== null}>
              {busy === "sie" ? "Exporterar…" : "Exportera SIE"}
            </Button>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink">Tidigare exporter</h3>
        {histStatus === "loading" ? (
          <p className="text-sm text-ink/50">Laddar…</p>
        ) : histStatus === "error" ? (
          <p className="text-sm text-red-600">Kunde inte ladda historik.</p>
        ) : history.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-ink/60">
              Inga exporter ännu.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-ink/50 dark:border-white/[0.08]">
                    <th className="px-5 py-3 font-medium">Datum</th>
                    <th className="px-5 py-3 font-medium">Period</th>
                    <th className="px-5 py-3 font-medium">Format</th>
                    <th className="px-5 py-3 font-medium">Kvitton</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-b border-gray-100 last:border-0 dark:border-white/[0.05]">
                      <td className="px-5 py-3 text-ink/70">{h.createdAt?.slice(0, 10)}</td>
                      <td className="px-5 py-3 text-ink/70">
                        {h.fromDate || h.toDate ? `${h.fromDate ?? "…"} – ${h.toDate ?? "…"}` : "Alla"}
                      </td>
                      <td className="px-5 py-3 uppercase text-ink/70">{h.format}</td>
                      <td className="px-5 py-3 text-ink/70">{h.receiptCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
