"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/verifications?status=${tab}`);
      if (!res.ok) throw new Error();
      setRows((await res.json()).accountants);
    } catch {
      toast.error("Kunde inte ladda verifieringar");
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verifieringar</h1>

      <div className="flex gap-2">
        {(Object.keys(TAB_LABEL) as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === s
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400"
            }`}
          >
            {TAB_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div>
          {loading ? (
            <p className="text-sm text-gray-500">Laddar…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500">Inga ärenden.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => setSelectedId(r.id)}
                    aria-current={selectedId === r.id}
                    className={cn(
                      "w-full rounded-2xl border bg-white p-4 text-left transition dark:bg-[#0D0D0D]",
                      selectedId === r.id
                        ? "border-nordic-600 ring-2 ring-nordic-600/15"
                        : "border-gray-200 hover:border-gray-300 dark:border-white/[0.08] dark:hover:border-white/[0.16]",
                    )}
                  >
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{r.name ?? r.email}</p>
                    {r.name && <p className="truncate text-xs text-gray-500">{r.email}</p>}
                    <p className="mt-2 text-xs text-gray-400">{new Date(r.verificationUpdatedAt).toLocaleString("sv-SE")}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0 rounded-2xl border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#0D0D0D]">
          {!selected ? (
            <p className="p-8 text-center text-sm text-gray-500">Välj en revisor för att granska dokumentet.</p>
          ) : (
            <div className="space-y-4 p-5">
              <div>
                <p className="text-xs text-gray-500">Namn som visas med märket</p>
                <p className="font-medium">{selected.name ?? "(inget namn)"}</p>
                <p className="text-xs text-gray-400">{selected.email}</p>
              </div>
              <button
                onClick={() => openDocument(selected.id)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-white/[0.08] dark:text-gray-300 dark:hover:bg-white/[0.04]"
              >
                Öppna dokument
              </button>
              <p className="text-xs text-gray-500">Kontrollera att namnet stämmer med dokumentet innan du godkänner.</p>
              {selected.verificationNote && (
                <p className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/[0.04]">Anteckning: {selected.verificationNote}</p>
              )}
              <textarea
                placeholder="Anteckning till revisorn (valfri, visas vid avslag)…"
                rows={2}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/[0.08] dark:bg-transparent dark:text-white"
              />
              <div className="flex flex-wrap gap-2">
                {selected.verificationStatus !== "rejected" && (
                  <button
                    disabled={busy}
                    onClick={() => decide(selected, "rejected")}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:text-red-400"
                  >
                    {selected.verificationStatus === "approved" ? "Återkalla" : "Avslå"}
                  </button>
                )}
                {selected.verificationStatus !== "approved" && (
                  <button
                    disabled={busy}
                    onClick={() => decide(selected, "approved")}
                    className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white hover:opacity-80 disabled:opacity-60 dark:bg-white dark:text-gray-900"
                  >
                    Godkänn
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
