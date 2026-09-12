"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountantReceiptEditor } from "@/components/accountant/AccountantReceiptEditor";

interface ReceiptRow {
  id: string;
  vendorName: string | null;
  date: string | null;
  totalAmount: string | null;
  vatAmount: string | null;
  vatRate: number | null;
  basCode: string | null;
  category: string | null;
  status: string;
}

/**
 * Receipts for a client, bound to GET /api/accountant/clients/[id]/receipts
 * using the API's own params (page/pageSize/q/from/to/sort/dir) and response
 * ({ receipts, total, page, pageSize }). A row expands into the editor, which
 * PATCHes the whitelisted fields. No client-side authorization — the server is
 * the boundary; a 404 is surfaced as an empty/unavailable state.
 */
export function AccountantReceipts({ companyId }: { companyId: string }) {
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("date");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const p = new URLSearchParams({ page: String(page), pageSize: "25", sort, dir });
      if (debouncedQ) p.set("q", debouncedQ);
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      const res = await fetch(`/api/accountant/clients/${companyId}/receipts?${p}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.receipts ?? []);
      setTotal(data.total ?? 0);
      setPageSize(data.pageSize ?? 25);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, [companyId, page, debouncedQ, from, to, sort, dir]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleSort(key: string) {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("desc");
    }
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="mb-1 block text-xs text-ink/50">Sök</label>
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Leverantör, BAS, belopp…"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink/50">Från</label>
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink/50">Till</label>
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        </div>
      </div>

      {status === "loading" ? (
        <p className="text-sm text-ink/50">Laddar kvitton…</p>
      ) : status === "error" ? (
        <p className="text-sm text-red-600">Kunde inte ladda kvitton.</p>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-ink/60">
            Inga kvitton matchar.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-ink/50 dark:border-white/[0.08]">
                  <SortTh label="Datum" k="date" sort={sort} dir={dir} onClick={toggleSort} />
                  <SortTh label="Leverantör" k="vendor" sort={sort} dir={dir} onClick={toggleSort} />
                  <SortTh label="BAS" k="bas" sort={sort} dir={dir} onClick={toggleSort} />
                  <SortTh label="Belopp" k="amount" sort={sort} dir={dir} onClick={toggleSort} />
                  <SortTh label="Moms" k="vat" sort={sort} dir={dir} onClick={toggleSort} />
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <>
                    <tr
                      key={r.id}
                      className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-white/[0.05] dark:hover:bg-white/[0.03]"
                      onClick={() => setOpenId(openId === r.id ? null : r.id)}
                    >
                      <td className="px-4 py-3 text-ink/70">{r.date ? r.date.slice(0, 10) : "—"}</td>
                      <td className="px-4 py-3 font-medium text-ink">{r.vendorName || "—"}</td>
                      <td className="px-4 py-3 text-ink/70">{r.basCode || "—"}</td>
                      <td className="px-4 py-3 text-ink/70">{r.totalAmount ?? "—"}</td>
                      <td className="px-4 py-3 text-ink/70">{r.vatAmount ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge className="bg-gray-100 text-gray-700 dark:bg-white/[0.08] dark:text-gray-200">
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-nordic-600">
                        {openId === r.id ? "Stäng" : "Granska"}
                      </td>
                    </tr>
                    {openId === r.id && (
                      <tr key={`${r.id}-editor`}>
                        <td colSpan={7} className="bg-gray-50 px-4 py-4 dark:bg-white/[0.02]">
                          <AccountantReceiptEditor
                            companyId={companyId}
                            receiptId={r.id}
                            onSaved={load}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {totalPages > 1 && status === "ok" && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink/50">Sida {page} av {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Föregående</Button>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Nästa</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SortTh({
  label,
  k,
  sort,
  dir,
  onClick,
}: {
  label: string;
  k: string;
  sort: string;
  dir: string;
  onClick: (k: string) => void;
}) {
  return (
    <th
      className="cursor-pointer select-none px-4 py-3 font-medium hover:text-ink"
      onClick={() => onClick(k)}
    >
      {label}
      {sort === k ? (dir === "asc" ? " ↑" : " ↓") : ""}
    </th>
  );
}
