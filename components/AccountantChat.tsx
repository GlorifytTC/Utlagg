"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Flag, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  senderId: string;
  senderRole: "accountant" | "company";
  senderName: string | null;
  body: string;
  createdAt: string;
}

interface Props {
  clientId: string;
  /** The current user's ID — used to align messages left/right. */
  currentUserId: string;
}

export function AccountantChat({ clientId, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [myRole, setMyRole] = useState<"accountant" | "company" | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ userId: string; messageId?: string } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/${clientId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data.messages);
      setMyRole(data.role);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${clientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) throw new Error();
      setText("");
      await load();
    } catch {
      toast.error("Kunde inte skicka meddelande");
    } finally {
      setSending(false);
    }
  }

  async function submitReport() {
    if (!reportTarget || !reportReason.trim()) return;
    const res = await fetch(`/api/chat/${clientId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportedUserId: reportTarget.userId,
        messageId: reportTarget.messageId ?? null,
        reason: reportReason,
      }),
    });
    if (res.ok) {
      toast.success("Rapport skickad — vi granskar den");
      setReportTarget(null);
      setReportReason("");
    } else {
      toast.error("Kunde inte skicka rapport");
    }
  }

  if (status === "loading") {
    return <p className="text-sm text-gray-500">Laddar chatt…</p>;
  }
  if (status === "error") {
    return <p className="text-sm text-red-600">Kunde inte ladda chatten.</p>;
  }

  return (
    <div className="flex flex-col rounded-2xl border border-gray-900/[0.07] bg-white/60 dark:border-white/[0.08] dark:bg-[#0D0D0D]">
      {/* Messages */}
      <div className="flex h-80 flex-col gap-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="m-auto text-sm text-gray-400">Inga meddelanden än.</p>
        )}
        {messages.map((m) => {
          const isMine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={cn("group flex gap-2", isMine ? "flex-row-reverse" : "flex-row")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                  isMine
                    ? "bg-nordic-600 text-white"
                    : "bg-gray-100 text-gray-900 dark:bg-white/[0.08] dark:text-white",
                )}
              >
                {!isMine && (
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-60">
                    {m.senderName ?? (m.senderRole === "accountant" ? "Revisor" : "Klient")}
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={cn("mt-0.5 text-[10px] opacity-50", isMine ? "text-right" : "")}>
                  {new Date(m.createdAt).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {!isMine && (
                <button
                  onClick={() => setReportTarget({ userId: m.senderId, messageId: m.id })}
                  className="mt-1 self-start opacity-0 transition-opacity group-hover:opacity-60 hover:!opacity-100"
                  title="Rapportera"
                >
                  <Flag size={13} className="text-gray-500" />
                </button>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 border-t border-gray-900/[0.07] p-3 dark:border-white/[0.08]">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          rows={2}
          placeholder="Skriv ett meddelande…"
          className="flex-1 resize-none rounded-xl border border-gray-900/[0.10] bg-transparent px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-nordic-500 dark:border-white/[0.10] dark:text-white dark:placeholder:text-gray-600"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-nordic-600 text-white transition hover:bg-nordic-700 disabled:opacity-40"
        >
          <Send size={15} />
        </button>
        {/* Report the other user directly */}
        {myRole && (
          <button
            onClick={() => {
              const otherMsg = messages.find((m) => m.senderId !== currentUserId);
              if (otherMsg) setReportTarget({ userId: otherMsg.senderId });
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-900/[0.07] text-gray-400 transition hover:text-red-500 dark:border-white/[0.08]"
            title="Rapportera användaren"
          >
            <Flag size={15} />
          </button>
        )}
      </div>

      {/* Report dialog */}
      {reportTarget && (
        <div className="border-t border-gray-900/[0.07] bg-amber-50 p-4 dark:border-white/[0.08] dark:bg-amber-950/20">
          <p className="mb-2 text-sm font-medium text-amber-800 dark:text-amber-200">Rapportera</p>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={2}
            placeholder="Beskriv varför du rapporterar…"
            className="mb-2 w-full resize-none rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm outline-none dark:border-amber-800 dark:bg-black/20 dark:text-white"
          />
          <div className="flex gap-2">
            <button
              onClick={submitReport}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700"
            >
              Skicka rapport
            </button>
            <button
              onClick={() => { setReportTarget(null); setReportReason(""); }}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
