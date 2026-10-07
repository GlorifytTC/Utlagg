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
import { isBanned, type ModerationAction } from "@/lib/moderation";

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
  reportedBannedUntil: string | null;
}

interface Message {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

const DISCIPLINARY_ACTIONS: { action: ModerationAction; label: string }[] = [
  { action: "warn", label: "Varning" },
  { action: "ban7", label: "Stäng av 7 dagar" },
  { action: "banPermanent", label: "Stäng av permanent" },
];

export default function AdminChatReportsPage() {
  const [tab, setTab] = useState<"pending" | "resolved" | "dismissed">("pending");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [detailTry, setDetailTry] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ report: ReportDetail; messages: Message[] } | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/chat-reports?status=${tab}`);
      if (!res.ok) throw new Error();
      setReports((await res.json()).reports);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setSelectedId(null); }, [tab]);

  useEffect(() => { setNote(""); }, [selectedId]);
  useEffect(() => {
    setDetail(null);
    setDetailError(false);
    if (!selectedId) return;
    let cancelled = false;
    fetch(`/api/admin/chat-reports/${selectedId}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch(() => { if (!cancelled) setDetailError(true); });
    return () => { cancelled = true; };
  }, [selectedId, detailTry]);

  async function moderate(id: string, status: "resolved" | "dismissed", action?: ModerationAction) {
    const res = await fetch(`/api/admin/chat-reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, moderatorNote: note || null, action }),
    });
    if (res.ok) {
      toast.success(
        action === "warn" ? "Varning skickad"
          : action ? "Användaren är avstängd"
          : status === "resolved" ? "Markerad som hanterad" : "Ignorerad",
      );
      setSelectedId(null);
      load();
    } else {
      toast.error("Åtgärd misslyckades");
    }
  }

  async function unban(id: string) {
    const res = await fetch(`/api/admin/chat-reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unban" }),
    });
    if (res.ok) {
      toast.success("Avstängningen är hävd");
      setDetail((d) => d && { ...d, report: { ...d.report, reportedBannedUntil: null } });
    } else {
      toast.error("Åtgärd misslyckades");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Chatrapporter" />

      <AdminTabs
        label="Status"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "pending", label: "Väntande" },
          { key: "resolved", label: "Hanterade" },
          { key: "dismissed", label: "Avvisade" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Report list: below lg only list OR detail is shown */}
        <div className={cn(selectedId && "max-lg:hidden")}>
          {error ? (
            <ErrorState onRetry={load} retryLabel="Försök igen">Kunde inte ladda rapporter.</ErrorState>
          ) : loading ? (
            <div className="space-y-2" role="status" aria-label="Laddar">
              {[0, 1, 2].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="panel rounded-2xl p-6 text-center text-sm text-gray-500 dark:text-gray-400">Inga rapporter.</div>
          ) : (
            <ul className="space-y-2">
              {reports.map((r) => (
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
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {r.reportedName ?? r.reportedEmail}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      Rapporterad av {r.reporterName ?? r.reporterEmail}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{r.reason}</p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
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
        <div className={cn("panel min-w-0 rounded-2xl", !selectedId && "max-lg:hidden")}>
          {!selectedId ? (
            <p className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Välj en rapport för att se konversationen.</p>
          ) : detailError ? (
            <div className="p-5">
              <Button variant="ghost" className="-ml-2 mb-3 lg:hidden" onClick={() => setSelectedId(null)}>
                <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
                Tillbaka
              </Button>
              <ErrorState onRetry={() => setDetailTry((n) => n + 1)} retryLabel="Försök igen">Kunde inte ladda konversationen.</ErrorState>
            </div>
          ) : !detail ? (
            <div className="space-y-3 p-5" role="status" aria-label="Laddar">
              <div className="skeleton h-6 w-1/2 rounded-lg" />
              <div className="skeleton h-24 rounded-xl" />
              <div className="skeleton h-40 rounded-xl" />
            </div>
          ) : (
            <ReportView
              onBack={() => setSelectedId(null)}
              detail={detail}
              note={note}
              setNote={setNote}
              onModerate={(status, action) => moderate(detail.report.id, status, action)}
              onUnban={() => unban(detail.report.id)}
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
  onUnban,
  onBack,
}: {
  detail: { report: ReportDetail; messages: Message[] };
  note: string;
  setNote: (v: string) => void;
  onModerate: (status: "resolved" | "dismissed", action?: ModerationAction) => void;
  onUnban: () => void;
  onBack: () => void;
}) {
  const nameOf = (id: string) =>
    id === r.reporterId
      ? r.reporterName ?? r.reporterEmail
      : id === r.reportedUserId
        ? r.reportedName ?? r.reportedEmail
        : "Annan deltagare";

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-900/10 p-5 dark:border-white/[0.08]">
        <Button variant="ghost" className="-ml-2 mb-2 lg:hidden" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          Tillbaka
        </Button>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Rapportör</p>
            <p className="font-medium">{r.reporterName ?? r.reporterEmail}</p>
            {r.reporterName && <p className="text-xs text-gray-500 dark:text-gray-400">{r.reporterEmail}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Rapporterad</p>
            <p className="font-medium text-red-600 dark:text-red-400">{r.reportedName ?? r.reportedEmail}</p>
            {r.reportedName && <p className="text-xs text-gray-500 dark:text-gray-400">{r.reportedEmail}</p>}
          </div>
        </div>
        <p className="mt-3 rounded-xl bg-gray-900/[0.04] p-3 text-sm dark:bg-white/[0.06]">{r.reason}</p>
      </div>

      {/* Conversation log */}
      <div className="max-h-[55dvh] overflow-y-auto p-5">
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
                    <p className="mb-1 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">{nameOf(m.senderId)}</p>
                  )}
                  <div
                    className={cn(
                      "max-w-[78%] rounded-[20px] px-3.5 py-2 text-sm leading-relaxed",
                      fromReporter
                        ? "bg-nordic-600 text-white"
                        : "bg-gray-900/[0.05] text-gray-900 dark:bg-white/[0.08] dark:text-gray-100",
                      flagged && "ring-2 ring-red-500 ring-offset-2 dark:ring-offset-[#0D0D0D]",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  </div>
                  <p className="mt-1 px-1 text-xs tabular-nums text-gray-500 dark:text-gray-400">
                    {flagged && <span className="font-medium text-red-600 dark:text-red-400">Rapporterat meddelande · </span>}
                    {new Date(m.createdAt).toLocaleString("sv-SE")}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3 border-t border-gray-900/10 p-5 dark:border-white/[0.08]">
        {r.status === "pending" ? (
          <>
            <Textarea
              aria-label="Moderatorsanteckning"
              placeholder="Moderatorsanteckning (valfri, visas för användaren vid varning)…"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => onModerate("dismissed")}>
                Ignorera
              </Button>
              <Button onClick={() => onModerate("resolved")}>
                Markera hanterad
              </Button>
            </div>
            <div className="rounded-xl border border-red-200 p-3 dark:border-red-900/50">
              <p className="mb-2 text-xs font-medium text-red-600 dark:text-red-400">
                Disciplinär åtgärd mot {r.reportedName ?? r.reportedEmail}
              </p>
              <div className="flex flex-wrap gap-2">
                {DISCIPLINARY_ACTIONS.map(({ action, label }) => (
                  <Button
                    key={action}
                    variant="destructive"
                    onClick={() => {
                      if (action !== "warn" && !window.confirm(`${label}: ${r.reportedName ?? r.reportedEmail}?`)) return;
                      onModerate("resolved", action);
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {r.status === "resolved" ? "Hanterad" : "Avvisad"}
              {r.moderatedAt && ` ${new Date(r.moderatedAt).toLocaleString("sv-SE")}`}
              {r.moderatorNote && ` · Anteckning: ${r.moderatorNote}`}
            </p>
            {isBanned(r.reportedBannedUntil ? new Date(r.reportedBannedUntil) : null) && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 p-3 dark:border-red-900/50">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {r.reportedName ?? r.reportedEmail} är avstängd till{" "}
                  {new Date(r.reportedBannedUntil!).toLocaleDateString("sv-SE")}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (window.confirm(`Häv avstängningen för ${r.reportedName ?? r.reportedEmail}?`)) onUnban();
                  }}
                >
                  Häv avstängning
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
