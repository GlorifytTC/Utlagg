"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowUp, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { formatDayLabel, formatTime } from "@/lib/chat-format";

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
  /** The current user's ID - used to align messages left/right. */
  currentUserId: string;
  /** Fill the parent's height instead of the fixed inline height. */
  fill?: boolean;
  /** Bump to refetch messages (e.g. when a new-message notification arrives). */
  refreshKey?: number;
  onSent?: () => void;
}

// Consecutive messages from the same sender within this window render as one group.
const GROUP_MS = 5 * 60_000;

export function AccountantChat({ clientId, currentUserId, fill, refreshKey, onSent }: Props) {
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [myRole, setMyRole] = useState<"accountant" | "company" | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ userId: string; messageId?: string } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    setStatus("loading");
    load();
  }, [load]);

  useEffect(() => {
    if (refreshKey) load();
  }, [refreshKey, load]);

  // Scroll the thread itself, never the page.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  // Auto-grow the composer up to ~6 lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [text]);

  async function send() {
    if (!text.trim() || sending) return;
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
      onSent?.();
    } catch {
      toast.error(t.chatSendFailed);
    } finally {
      setSending(false);
      inputRef.current?.focus();
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
      toast.success(t.chatReportSent);
      setReportTarget(null);
      setReportReason("");
    } else {
      toast.error(t.chatReportFailed);
    }
  }

  const frame = cn(
    "flex flex-col",
    fill ? "h-full min-h-0" : "panel rounded-2xl",
  );

  if (status !== "ok") {
    return (
      <div className={cn(frame, "items-center justify-center", !fill && "h-80")}>
        {status === "loading" ? (
          <div role="status" aria-label={t.loading} className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent dark:border-gray-600 dark:border-t-transparent" />
        ) : (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">{t.chatLoadError}</p>
        )}
      </div>
    );
  }

  const otherMsg = messages.find((m) => m.senderId !== currentUserId);

  return (
    <div className={frame}>
      {/* Messages */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        className={cn("flex flex-col overflow-y-auto px-4 py-5 sm:px-6", fill ? "flex-1 min-h-0" : "h-[50dvh] min-h-[320px]")}
      >
        {messages.length === 0 && (
          <p className="m-auto text-sm text-gray-500 dark:text-gray-400">{t.chatEmptyThread}</p>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const at = new Date(m.createdAt);
          const newDay = !prev || new Date(prev.createdAt).toDateString() !== at.toDateString();
          const joinsPrev = !newDay && prev.senderId === m.senderId && at.getTime() - new Date(prev.createdAt).getTime() < GROUP_MS;
          const joinsNext =
            !!next &&
            next.senderId === m.senderId &&
            new Date(next.createdAt).toDateString() === at.toDateString() &&
            new Date(next.createdAt).getTime() - at.getTime() < GROUP_MS;
          const isMine = m.senderId === currentUserId;

          return (
            <Fragment key={m.id}>
              {newDay && (
                <div className="my-4 flex items-center gap-3 first:mt-0" role="separator">
                  <span className="h-px flex-1 bg-gray-900/[0.06] dark:bg-white/[0.07]" />
                  <span className="text-xs font-medium text-gray-500 first-letter:uppercase dark:text-gray-400">
                    {formatDayLabel(at, lang, t.chatsToday, t.chatsYesterday)}
                  </span>
                  <span className="h-px flex-1 bg-gray-900/[0.06] dark:bg-white/[0.07]" />
                </div>
              )}
              <div className={cn("group flex items-end gap-1.5", isMine ? "flex-row-reverse" : "flex-row", joinsPrev ? "mt-0.5" : "mt-3")}>
                <div className={cn("flex min-w-0 max-w-[85%] flex-col sm:max-w-[65%]", isMine ? "items-end" : "items-start")}>
                  {!isMine && !joinsPrev && (
                    <p className="mb-1 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                      {m.senderName ?? (m.senderRole === "accountant" ? t.chatRoleAccountant : t.chatRoleClient)}
                    </p>
                  )}
                  <div
                    title={formatTime(at, lang)}
                    className={cn(
                      "rounded-[20px] px-3.5 py-2 text-[14px] leading-relaxed",
                      isMine
                        ? "bg-nordic-600 text-white"
                        : "bg-gray-900/[0.05] text-gray-900 dark:bg-white/[0.08] dark:text-gray-100",
                      isMine && joinsPrev && "rounded-tr-md",
                      isMine && joinsNext && "rounded-br-md",
                      !isMine && joinsPrev && "rounded-tl-md",
                      !isMine && joinsNext && "rounded-bl-md",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  </div>
                  {!joinsNext && (
                    <p className="mt-1 px-1 text-xs tabular-nums text-gray-500 dark:text-gray-400">{formatTime(at, lang)}</p>
                  )}
                </div>
                {!isMine && (
                  <button
                    onClick={() => setReportTarget({ userId: m.senderId, messageId: m.id })}
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-500 opacity-100 transition-opacity hover:text-red-500 focus-visible:opacity-100 lg:opacity-0 lg:group-hover:opacity-100",
                      !joinsNext && "mb-2",
                    )}
                    title={t.chatReport}
                    aria-label={t.chatReport}
                  >
                    <Flag size={12} aria-hidden />
                  </button>
                )}
              </div>
            </Fragment>
          );
        })}
      </div>

      {/* Report dialog */}
      {reportTarget && (
        <div className="border-t border-gray-900/[0.07] bg-amber-50 p-4 dark:border-white/[0.08] dark:bg-amber-950/20">
          <p className="mb-2 text-sm font-medium text-amber-800 dark:text-amber-200">{t.chatReport}</p>
          <textarea
            aria-label={t.chatReport}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={2}
            autoFocus
            placeholder={t.chatReportPlaceholder}
            className="mb-2 w-full resize-none rounded-lg border border-amber-200 bg-white px-3 py-2 text-base outline-none sm:text-sm dark:border-amber-800 dark:bg-black/20 dark:text-white"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitReport}
              className="min-h-11 rounded-lg bg-amber-700 px-3 py-1.5 text-sm text-white hover:bg-amber-800 md:min-h-0"
            >
              {t.chatReportSend}
            </button>
            <button
              onClick={() => { setReportTarget(null); setReportReason(""); }}
              className="min-h-11 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 md:min-h-0 dark:text-gray-400 dark:hover:text-gray-300"
            >
              {t.chatCancel}
            </button>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-gray-900/[0.07] p-3 dark:border-white/[0.08]">
        <div className="flex items-end gap-2">
          <div className="flex flex-1 items-end rounded-[22px] border border-gray-900/[0.10] bg-white pl-4 pr-1.5 transition-colors focus-within:border-nordic-600/50 focus-within:ring-4 focus-within:ring-nordic-600/10 dark:border-white/[0.10] dark:bg-white/[0.03]">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
              }}
              rows={1}
              maxLength={2000}
              aria-label={t.chatPlaceholder}
              placeholder={t.chatPlaceholder}
              className="max-h-36 flex-1 resize-none bg-transparent py-2.5 text-base text-gray-900 outline-none sm:text-sm placeholder:text-gray-500 dark:text-white dark:placeholder:text-gray-400"
            />
            <button
              onClick={send}
              disabled={sending || !text.trim()}
              aria-label={t.chatSend}
              className="my-1 flex h-11 w-11 shrink-0 md:h-10 md:w-10 items-center justify-center rounded-full bg-nordic-600 text-white transition hover:bg-nordic-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 dark:text-[#050505] disabled:bg-gray-900/10 disabled:text-gray-500 dark:disabled:bg-white/10"
            >
              <ArrowUp size={16} strokeWidth={2.25} aria-hidden />
            </button>
          </div>
          {/* Report the other user directly */}
          {myRole && otherMsg && (
            <button
              onClick={() => setReportTarget({ userId: otherMsg.senderId })}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
              title={t.chatReportUser}
              aria-label={t.chatReportUser}
            >
              <Flag size={15} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
