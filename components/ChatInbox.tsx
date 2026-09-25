"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight, MessageSquare, Search } from "lucide-react";
import { AccountantChat } from "@/components/AccountantChat";
import { ClientAvatar } from "@/components/accountant/ClientAvatar";
import { useLanguage } from "@/context/LanguageContext";
import { useNotifications } from "@/context/NotificationContext";
import { formatListDate } from "@/lib/chat-format";
import { cn } from "@/lib/utils";

interface Conversation {
  clientId: string;
  companyId: string;
  role: "accountant" | "company";
  name: string;
  logoUrl: string | null;
  lastMessage: { body: string; createdAt: string; mine: boolean } | null;
  activityAt: string | null;
}

/**
 * Two-pane inbox: conversation list (avatar, name, last-message preview, date)
 * beside the open thread. On small screens it shows one pane at a time. The
 * open conversation lives in `?c=<clientId>` so it is linkable from emails and
 * notifications. `role` picks which side of the relationships to list.
 */
export function ChatInbox({ role, currentUserId }: { role: "accountant" | "company"; currentUserId: string }) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = useSearchParams().get("c");
  const { chat, clear } = useNotifications();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [query, setQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/chat");
      if (!res.ok) throw new Error();
      const data: { conversations: Conversation[] } = await res.json();
      setConversations(data.conversations.filter((c) => c.role === role));
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, [role]);

  useEffect(() => { load(); }, [load]);

  // A new-message notification arrived while the inbox is open: refresh both panes.
  useEffect(() => {
    if (!chat) return;
    load();
    setRefreshKey((k) => k + 1);
    clear("chat");
  }, [chat, load, clear]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? conversations.filter((c) => c.name.toLowerCase().includes(q)) : conversations;
  }, [conversations, query]);

  const selected = conversations.find((c) => c.clientId === selectedId) ?? null;
  const select = (id: string | null) => router.replace(id ? `${pathname}?c=${id}` : pathname, { scroll: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-gray-900 dark:text-white">{t.chatsTitle}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {role === "accountant" ? t.chatsSubtitleAccountant : t.chatsSubtitle}
        </p>
      </div>
      {body()}
    </div>
  );

  function body() {
    if (status === "loading") {
      return (
        <div className="flex items-center justify-center p-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
        </div>
      );
    }

    if (status === "error") {
      return <p className="text-sm text-red-600">{t.chatsLoadError}</p>;
    }

    if (conversations.length === 0) {
      return (
        <div className="flex flex-col items-center rounded-2xl border border-gray-900/[0.07] bg-white/60 px-6 py-14 text-center backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-nordic-600/10 text-nordic-600 dark:bg-nordic-600/20">
            <MessageSquare className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
            {role === "accountant" ? t.chatsEmptyAccountant : t.chatsEmpty}
          </p>
          {role === "company" && (
            <Link
              href="/dashboard/marketplace"
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-nordic-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-nordic-700"
            >
              {t.chatsFindAccountant}
            </Link>
          )}
        </div>
      );
    }

    return (
      <div className="grid h-[calc(100dvh-16rem)] min-h-[420px] overflow-hidden rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D] md:h-[calc(100dvh-13rem)] lg:h-[calc(100dvh-10.5rem)] lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr]">
        {/* Conversation list */}
        <aside className={cn("min-h-0 flex-col border-gray-900/[0.07] dark:border-white/[0.08] lg:flex lg:border-r", selected ? "hidden" : "flex")}>
          <div className="p-3">
            <label className="relative block">
              <span className="sr-only">{t.chatsSearch}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.chatsSearch}
                className="w-full rounded-xl border border-transparent bg-gray-900/[0.04] py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-nordic-600/40 focus:bg-white dark:bg-white/[0.05] dark:text-white dark:focus:bg-transparent"
              />
            </label>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {visible.length === 0 && <li className="px-3 py-6 text-center text-sm text-gray-400">{t.chatsNoMatch}</li>}
            {visible.map((c) => {
              const active = c.clientId === selected?.clientId;
              return (
                <li key={c.clientId}>
                  <button
                    onClick={() => select(c.clientId)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic-600/30",
                      active
                        ? "bg-nordic-600/[0.08] dark:bg-nordic-600/[0.14]"
                        : "hover:bg-gray-900/[0.03] dark:hover:bg-white/[0.04]",
                    )}
                  >
                    {active && <span aria-hidden className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-nordic-600" />}
                    <ClientAvatar name={c.name} logoUrl={c.logoUrl} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium text-gray-900 dark:text-white">{c.name}</span>
                        {c.lastMessage && (
                          <time
                            dateTime={c.lastMessage.createdAt}
                            className="shrink-0 text-[11px] tabular-nums text-gray-400 dark:text-gray-500"
                          >
                            {formatListDate(new Date(c.lastMessage.createdAt), lang, t.chatsYesterday)}
                          </time>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-gray-500 dark:text-gray-400">
                        {c.lastMessage ? (
                          <>
                            {c.lastMessage.mine && <span className="text-gray-400 dark:text-gray-500">{t.chatsYou}: </span>}
                            {c.lastMessage.body}
                          </>
                        ) : (
                          <span className="italic text-gray-400 dark:text-gray-500">{t.chatsNoMessages}</span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Thread */}
        <section className={cn("min-h-0 flex-col lg:flex", selected ? "flex" : "hidden")}>
          {selected ? (
            <>
              <header className="flex items-center gap-3 border-b border-gray-900/[0.07] px-3 py-3 dark:border-white/[0.08] sm:px-5">
                <button
                  onClick={() => select(null)}
                  aria-label={t.chatsBack}
                  className="-ml-1 rounded-lg p-1.5 text-gray-500 hover:bg-gray-900/[0.04] dark:text-gray-400 dark:hover:bg-white/[0.06] lg:hidden"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <ClientAvatar name={selected.name} logoUrl={selected.logoUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{selected.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {role === "accountant" ? t.chatRoleClient : t.chatRoleAccountant}
                  </p>
                </div>
                {role === "accountant" && (
                  <Link
                    href={`/accountant/clients/${selected.companyId}`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gray-900/[0.10] px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-gray-900/20 hover:text-gray-800 dark:border-white/[0.10] dark:text-gray-400 dark:hover:text-white"
                  >
                    {t.chatsOpenClient}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </header>
              <div className="min-h-0 flex-1">
                <AccountantChat
                  key={selected.clientId}
                  clientId={selected.clientId}
                  currentUserId={currentUserId}
                  fill
                  refreshKey={refreshKey}
                  onSent={load}
                />
              </div>
            </>
          ) : (
            <div className="m-auto flex flex-col items-center px-6 text-center">
              <MessageSquare className="mb-3 h-6 w-6 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.chatsSelect}</p>
            </div>
          )}
        </section>
      </div>
    );
  }
}
