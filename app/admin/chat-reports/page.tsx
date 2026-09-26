"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  reason: string;
  status: string;
  messageId: string | null;
  moderatorNote: string | null;
  moderatedAt: string | null;
  createdAt: string;
  reporterEmail: string;
  reporterName: string | null;
  reportedEmail: string;
  reportedName: string | null;
}

interface ReportDetail extends Report {
  reporterId: string;
  reportedUserId: string;
}

interface Message {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

// ponytail: placeholders only — no API behind them yet.
const DISCIPLINARY_ACTIONS = ["Varning", "Stäng av 7 dagar", "Stäng av permanent"];

export default function AdminChatReportsPage() {
  const [tab, setTab] = useState<"pending" | "resolved" | "dismissed">("pending");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ report: ReportDetail; messages: Message[] } | null>(null);
  const [note, setNote] = useState("");

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
  useEffect(() => { setSelectedId(null); }, [tab]);

  useEffect(() => {
    setDetail(null);
    setNote("");
    if (!selectedId) return;
    let cancelled = false;
    fetch(`/api/admin/chat-reports/${selectedId}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch(() => toast.error("Kunde inte ladda konversationen"));
    return () => { cancelled = true; };
  }, [selectedId]);

  async function moderate(id: string, status: "resolved" | "dismissed") {
    const res = await fetch(`/api/admin/chat-reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, moderatorNote: note || null }),
    });
    if (res.ok) {
      toast.success(status === "resolved" ? "Markerad som hanterad" : "Ignorerad");
      setSelectedId(null);
      load();
    } else {
      toast.error("Åtgärd misslyckades");
    }
  }

  return (
    <div className="space-y-6">
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

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Report list */}
        <div>
          {loading ? (
            <p className="text-sm text-gray-500">Laddar…</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-gray-500">Inga rapporter.</p>
          ) : (
            <ul className="space-y-2">
              {reports.map((r) => (
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
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {r.reportedName ?? r.reportedEmail}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      Rapporterad av {r.reporterName ?? r.reporterEmail}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{r.reason}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleString("sv-SE")}
                      {r.messageId && " · inkl. meddelande"}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Report detail */}
        <div className="min-w-0 rounded-2xl border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#0D0D0D]">
          {!selectedId ? (
            <p className="p-8 text-center text-sm text-gray-500">Välj en rapport för att se konversationen.</p>
          ) : !detail ? (
            <p className="p-8 text-center text-sm text-gray-500">Laddar…</p>
          ) : (
            <ReportView
              detail={detail}
              note={note}
              setNote={setNote}
              onModerate={(status) => moderate(detail.report.id, status)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ReportView({
  detail: { report: r, messages },
  note,
  setNote,
  onModerate,
}: {
  detail: { report: ReportDetail; messages: Message[] };
  note: string;
  setNote: (v: string) => void;
  onModerate: (status: "resolved" | "dismissed") => void;
}) {
  const nameOf = (id: string) =>
    id === r.reporterId
      ? r.reporterName ?? r.reporterEmail
      : id === r.reportedUserId
        ? r.reportedName ?? r.reportedEmail
        : "Annan deltagare";

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 p-5 dark:border-white/[0.08]">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">Rapportör</p>
            <p className="font-medium">{r.reporterName ?? r.reporterEmail}</p>
            {r.reporterName && <p className="text-xs text-gray-400">{r.reporterEmail}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-500">Rapporterad</p>
            <p className="font-medium text-red-600 dark:text-red-400">{r.reportedName ?? r.reportedEmail}</p>
            {r.reportedName && <p className="text-xs text-gray-400">{r.reportedEmail}</p>}
          </div>
        </div>
        <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/[0.04]">{r.reason}</p>
      </div>

      {/* Conversation log */}
      <div className="max-h-[55vh] overflow-y-auto p-5">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-gray-500">Ingen konversation hittades mellan användarna.</p>
        ) : (
          <ol className="space-y-3">
            {messages.map((m, i) => {
              const fromReporter = m.senderId === r.reporterId;
              const flagged = m.id === r.messageId;
              const showName = messages[i - 1]?.senderId !== m.senderId;
              return (
                <li key={m.id} className={cn("flex flex-col", fromReporter ? "items-end" : "items-start")}>
                  {showName && (
                    <p className="mb-1 px-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">{nameOf(m.senderId)}</p>
                  )}
                  <div
                    className={cn(
                      "max-w-[78%] rounded-[20px] px-3.5 py-2 text-[14px] leading-relaxed",
                      fromReporter
                        ? "bg-nordic-600 text-white"
                        : "bg-gray-900/[0.05] text-gray-900 dark:bg-white/[0.08] dark:text-gray-100",
                      flagged && "ring-2 ring-red-500 ring-offset-2 dark:ring-offset-[#0D0D0D]",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  </div>
                  <p className="mt-1 px-1 text-[10.5px] tabular-nums text-gray-400 dark:text-gray-500">
                    {flagged && <span className="font-medium text-red-500">Rapporterat meddelande · </span>}
                    {new Date(m.createdAt).toLocaleString("sv-SE")}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3 border-t border-gray-200 p-5 dark:border-white/[0.08]">
        {r.status === "pending" ? (
          <>
            <textarea
              placeholder="Moderatorsanteckning (valfri)…"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/[0.08] dark:bg-transparent dark:text-white"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onModerate("dismissed")}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-white/[0.08] dark:text-gray-400"
              >
                Ignorera
              </button>
              <button
                onClick={() => onModerate("resolved")}
                className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white hover:opacity-80 dark:bg-white dark:text-gray-900"
              >
                Markera hanterad
              </button>
            </div>
            <div className="rounded-xl border border-red-200 p-3 dark:border-red-900/50">
              <p className="mb-2 text-xs font-medium text-red-600 dark:text-red-400">
                Disciplinär åtgärd mot {r.reportedName ?? r.reportedEmail}
              </p>
              <div className="flex flex-wrap gap-2">
                {DISCIPLINARY_ACTIONS.map((a) => (
                  <button
                    key={a}
                    onClick={() => toast.info("Inte implementerat ännu")}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-500">
            {r.status === "resolved" ? "Hanterad" : "Avvisad"}
            {r.moderatedAt && ` ${new Date(r.moderatedAt).toLocaleString("sv-SE")}`}
            {r.moderatorNote && ` · Anteckning: ${r.moderatorNote}`}
          </p>
        )}
      </div>
    </div>
  );
}
