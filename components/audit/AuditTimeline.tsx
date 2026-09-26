"use client";

import { motion } from "framer-motion";
import { Eye, Pencil, Download, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { Translations } from "@/lib/translations";

export interface AuditEntry {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  createdAt: string;
  actorName?: string | null;
  actorEmail?: string | null;
}

// ── helpers ─────────────────────────────────────────────────────────────────

function actionLabel(action: string, t: Translations): string {
  switch (action) {
    case "accountant.client.view":    return t.auditClientView;
    case "accountant.receipt.list":   return t.auditReceiptList;
    case "accountant.receipt.view":   return t.auditReceiptView;
    case "accountant.receipt.update": return t.auditReceiptUpdate;
    case "accountant.export.csv":     return t.auditExportCsv;
    case "accountant.export.sie":     return t.auditExportSie;
    default: return action;
  }
}

type ActionKind = "view" | "edit" | "export";

function actionKind(action: string): ActionKind {
  if (action.includes("export")) return "export";
  if (action.includes("update") || action.includes("edit") || action.includes("delete")) return "edit";
  return "view";
}

const KIND_META: Record<ActionKind, {
  Icon: LucideIcon;
  dotCls: string;
  chipCls: string;
  iconCls: string;
}> = {
  view: {
    Icon: Eye,
    dotCls: "bg-gray-300 dark:bg-gray-600",
    chipCls: "bg-gray-100 dark:bg-white/[0.06]",
    iconCls: "text-gray-400 dark:text-gray-500",
  },
  edit: {
    Icon: Pencil,
    dotCls: "bg-accent",
    chipCls: "bg-nordic-50/60 dark:bg-[#2A1510]",
    iconCls: "text-accent",
  },
  export: {
    Icon: Download,
    dotCls: "bg-amber",
    chipCls: "bg-amber/[0.08] dark:bg-amber/[0.12]",
    iconCls: "text-amber",
  },
};

function relativeTime(iso: string, t: Translations): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return t.auditJustNow;
  if (min < 60) return t.auditMin.replace("{n}", String(min));
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return t.auditHours.replace("{n}", String(hrs));
  return t.auditDays.replace("{n}", String(Math.floor(hrs / 24)));
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function dayLabel(iso: string, t: Translations, locale: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return t.auditToday;
  if (d.toDateString() === yesterday.toDateString()) return t.auditYesterday;

  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

function formatChanges(
  old: Record<string, unknown> | null | undefined,
  next: Record<string, unknown> | null | undefined,
): string | null {
  if (!next || Object.keys(next).length === 0) return null;
  const keys = Object.keys(next);
  if (keys.length === 1) {
    const k = keys[0];
    const from = old?.[k] ?? "–";
    const to = next[k] ?? "–";
    return `${k}: ${from} → ${to}`;
  }
  return keys.join(", ");
}

// ── component ────────────────────────────────────────────────────────────────

interface Props {
  entries: AuditEntry[];
  /** Show actor name/email — used in company view where multiple accountants act */
  showActor?: boolean;
  /** Shown while loading */
  loading?: boolean;
}

export function AuditTimeline({ entries, showActor = false, loading = false }: Props) {
  const { t, lang } = useLanguage();
  const locale = lang === "en" ? "en-GB" : "sv-SE";
  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 px-6 py-14 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
          <Eye className="h-5 w-5 text-gray-300 dark:text-gray-600" />
        </div>
        <p className="font-display text-sm font-medium text-gray-900 dark:text-white">{t.auditEmptyTitle}</p>
        <p className="max-w-xs text-sm text-gray-400 dark:text-gray-500">
          {t.auditEmptyBody}
        </p>
      </motion.div>
    );
  }

  // Group by day, preserving order (entries are already DESC so reverse for grouping)
  const groups: { day: string; label: string; items: AuditEntry[] }[] = [];
  for (const entry of entries) {
    const dk = dayKey(entry.createdAt);
    const last = groups[groups.length - 1];
    if (last?.day === dk) {
      last.items.push(entry);
    } else {
      groups.push({ day: dk, label: dayLabel(entry.createdAt, t, locale), items: [entry] });
    }
  }

  let globalIndex = 0;

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.day}>
          {/* Day label */}
          <p className="mb-3 text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">
            {group.label}
          </p>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute bottom-0 left-4 top-0 w-px bg-gray-900/[0.07] dark:bg-white/[0.07]" />

            <div className="space-y-0.5">
              {group.items.map((entry) => {
                const idx = globalIndex++;
                const kind = actionKind(entry.action);
                const meta = KIND_META[kind];
                const { Icon } = meta;
                const label = actionLabel(entry.action, t);
                const changes = formatChanges(
                  entry.oldValues as Record<string, unknown> | null,
                  entry.newValues as Record<string, unknown> | null,
                );
                const sub = changes ?? entry.details ?? null;
                const actor = entry.actorName ?? entry.actorEmail ?? null;

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.025, duration: 0.2, ease: "easeOut" }}
                    className="group relative flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-900/[0.02] dark:hover:bg-white/[0.02]"
                  >
                    {/* Dot on the timeline line */}
                    <div className="relative z-10 mt-[9px] shrink-0">
                      <div className={`h-2 w-2 rounded-full ${meta.dotCls}`} />
                    </div>

                    {/* Icon chip */}
                    <div className={`mt-[3px] flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.chipCls}`}>
                      <Icon className={`h-3.5 w-3.5 ${meta.iconCls}`} strokeWidth={1.75} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {label}
                          </span>
                          {showActor && actor && (
                            <span className="ml-1.5 text-sm text-gray-400 dark:text-gray-500">
                              {t.auditBy.replace("{actor}", actor)}
                            </span>
                          )}
                        </div>
                        <time
                          dateTime={entry.createdAt}
                          title={new Date(entry.createdAt).toLocaleString(locale)}
                          className="shrink-0 text-[11px] tabular-nums text-gray-400 dark:text-gray-500"
                        >
                          {relativeTime(entry.createdAt, t)}
                        </time>
                      </div>
                      {sub && (
                        <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                          {sub}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
