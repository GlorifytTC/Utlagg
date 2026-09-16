"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface Report {
  id: string;
  reason: string;
  status: string;
  messageId: string | null;
  moderatorNote: string | null;
  moderatedAt: string | null;
  createdAt: string;
  reporterEmail: string;
  reportedEmail: string;
}

export default function AdminChatReportsPage() {
  const [tab, setTab] = useState<"pending" | "resolved" | "dismissed">("pending");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/chat-reports?status=${tab}`);
      if (!res.ok) throw new Error();
      setReports((await res.json()).reports);
    } catch {
      toast.error("Kunde inte ladda rapporter");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function moderate(id: string, status: "resolved" | "dismissed") {
    const res = await fetch(`/api/admin/chat-reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, moderatorNote: notes[id] ?? null }),
    });
    if (res.ok) {
      toast.success(status === "resolved" ? "Markerad som hanterad" : "Avvisad");
      load();
    } else {
      toast.error("Åtgärd misslyckades");
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chatrapporter</h1>

      <div className="flex gap-2">
        {(["pending", "resolved", "dismissed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === s
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400"
            }`}
          >
            {s === "pending" ? "Väntande" : s === "resolved" ? "Hanterade" : "Avvisade"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Laddar…</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-gray-500">Inga rapporter.</p>
      ) : (
        <ul className="space-y-4">
          {reports.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[#0D0D0D]"
            >
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    <span className="text-gray-500">Rapportör:</span> {r.reporterEmail}
                  </p>
                  <p className="text-sm font-medium">
                    <span className="text-gray-500">Rapporterad:</span> {r.reportedEmail}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleString("sv-SE")}
                    {r.messageId && " · inkl. meddelande"}
                  </p>
                </div>
              </div>
              <p className="mb-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/[0.04]">{r.reason}</p>
              {tab === "pending" && (
                <div className="space-y-2">
                  <textarea
                    placeholder="Moderatorsanteckning (valfri)…"
                    rows={2}
                    value={notes[r.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                    className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/[0.08] dark:bg-transparent dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => moderate(r.id, "resolved")}
                      className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white hover:opacity-80 dark:bg-white dark:text-gray-900"
                    >
                      Markera hanterad
                    </button>
                    <button
                      onClick={() => moderate(r.id, "dismissed")}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-white/[0.08] dark:text-gray-400"
                    >
                      Avvisa
                    </button>
                  </div>
                </div>
              )}
              {tab !== "pending" && r.moderatorNote && (
                <p className="text-xs text-gray-500">Anteckning: {r.moderatorNote}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
