"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { AdminTabs } from "@/components/admin/AdminTabs";

type Status = "pending" | "approved" | "rejected";

interface Accountant {
  id: string;
  name: string | null;
  email: string;
  verificationStatus: Status;
  verificationNote: string | null;
  verificationUpdatedAt: string;
}

const TAB_LABEL: Record<Status, string> = { pending: "Väntande", approved: "Godkända", rejected: "Avslagna" };

export default function AdminVerificationsPage() {
  const [tab, setTab] = useState<Status>("pending");
  const [rows, setRows] = useState<Accountant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/verifications?status=${tab}`);
      if (!res.ok) throw new Error();
      setRows((await res.json()).accountants);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setSelectedId(null); }, [tab]);
  useEffect(() => { setNote(""); }, [selectedId]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  async function openDocument(id: string) {
    // Open the tab synchronously so popup blockers allow it, then point it at
    // the short-lived presigned URL once we have it.
    const w = window.open("", "_blank");
    if (w) w.opener = null;
    const res = await fetch(`/api/admin/verifications/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      w?.close();
      toast.error(data.error ?? "Kunde inte öppna dokumentet");
      return;
    }
    if (w) w.location.href = data.url;
  }

  async function decide(a: Accountant, status: "approved" | "rejected") {
    if (status === "rejected" && a.verificationStatus === "approved" &&
        !window.confirm(`Återkalla verifieringen för ${a.name ?? a.email}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/verifications/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note || undefined, seenUpdatedAt: a.verificationUpdatedAt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Åtgärd misslyckades");
        if (res.status === 409) load();
        return;
      }
      toast.success(status === "approved" ? "Revisorn är verifierad" : "Verifieringen avslogs");
      setSelectedId(null);
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Verifieringar" />

      <AdminTabs
        label="Status"
        value={tab}
        onChange={setTab}
        tabs={(Object.keys(TAB_LABEL) as Status[]).map((s) => ({ key: s, label: TAB_LABEL[s] }))}
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className={cn(selected && "max-lg:hidden")}>
          {error ? (
            <ErrorState onRetry={load} retryLabel="Försök igen">Kunde inte ladda verifieringar.</ErrorState>
          ) : loading ? (
            <div className="space-y-2" role="status" aria-label="Laddar">
              {[0, 1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="panel rounded-2xl p-6 text-center text-sm text-gray-500 dark:text-gray-400">Inga ärenden.</div>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => setSelectedId(r.id)}
                    aria-current={selectedId === r.id}
                    className={cn(
                      "w-full rounded-2xl border bg-white p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 dark:bg-[#0D0D0D]",
                      selectedId === r.id
                        ? "border-nordic-600 ring-2 ring-nordic-600/15"
                        : "border-gray-200 hover:border-gray-300 dark:border-white/[0.08] dark:hover:border-white/[0.16]",
                    )}
                  >
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{r.name ?? r.email}</p>
                    {r.name && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{r.email}</p>}
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{new Date(r.verificationUpdatedAt).toLocaleString("sv-SE")}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={cn("panel min-w-0 rounded-2xl", !selected && "max-lg:hidden")}>
          {!selected ? (
            <p className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Välj en revisor för att granska dokumentet.</p>
          ) : (
            <div className="space-y-4 p-5">
              <Button variant="ghost" className="-ml-2 lg:hidden" onClick={() => setSelectedId(null)}>
                <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
                Tillbaka
              </Button>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Namn som visas med märket</p>
                <p className="font-medium">{selected.name ?? "(inget namn)"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selected.email}</p>
              </div>
              <Button variant="outline" onClick={() => openDocument(selected.id)}>
                Öppna dokument
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400">Kontrollera att namnet stämmer med dokumentet innan du godkänner.</p>
              {selected.verificationNote && (
                <p className="rounded-xl bg-gray-900/[0.04] p-3 text-sm dark:bg-white/[0.06]">Anteckning: {selected.verificationNote}</p>
              )}
              <Textarea
                aria-label="Anteckning till revisorn"
                placeholder="Anteckning till revisorn (valfri, visas vid avslag)…"
                rows={2}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="resize-none"
              />
              <div className="flex flex-wrap gap-2">
                {selected.verificationStatus !== "rejected" && (
                  <Button variant="destructive" disabled={busy} onClick={() => decide(selected, "rejected")}>
                    {selected.verificationStatus === "approved" ? "Återkalla" : "Avslå"}
                  </Button>
                )}
                {selected.verificationStatus !== "approved" && (
                  <Button disabled={busy} onClick={() => decide(selected, "approved")}>
                    Godkänn
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
