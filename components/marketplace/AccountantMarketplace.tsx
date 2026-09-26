"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Search, MapPin, X, Users, Star, CalendarDays } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface AccountantRow {
  id: string;
  name: string | null;
  email: string;
  logoUrl: string | null;
  city: string | null;
  bio: string | null;
  specializations: string[] | null;
  activeClientCount: number;
  isBoosted: boolean;
  avgRating: number | null;
  reviewCount: number;
  joinedYear: number | null;
  myStatus: "pending" | "active" | "revoked" | null;
  firmId: string | null;
  firmName: string | null;
  firmLogoUrl: string | null;
}

interface Props {
  viewerAccountantId?: string;
  compact?: boolean;
  profileBasePath?: string;
}

function Avatar({
  name,
  email,
  logoUrl,
  firmLogoUrl,
  firmName,
  isBoosted,
}: {
  name: string | null;
  email: string;
  logoUrl: string | null;
  firmLogoUrl?: string | null;
  firmName?: string | null;
  isBoosted?: boolean;
}) {
  const displayLogoUrl = firmLogoUrl ?? logoUrl;
  const displayAlt = firmName ?? name ?? email;
  const label = (name ?? email).charAt(0).toUpperCase();
  const ring = isBoosted
    ? "ring-2 ring-offset-2 ring-nordic-600/50 dark:ring-offset-[#0D0D0D]"
    : "";
  if (displayLogoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={displayLogoUrl}
        alt={displayAlt}
        className={`h-14 w-14 shrink-0 rounded-full object-cover ${ring}`}
      />
    );
  }
  return (
    <div
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-nordic-600/10 text-xl font-bold text-nordic-600 ${ring}`}
    >
      {label}
    </div>
  );
}

function RatingBadge({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-display text-xl font-bold leading-none text-gray-900 dark:text-white">
        {rating.toFixed(1)}
      </span>
      <span className="text-[11px] leading-none text-nordic-600">
        {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
      </span>
      <span className="text-[10px] text-gray-400">({count})</span>
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "pending" }) {
  const { t } = useLanguage();
  if (status === "active") {
    return (
      <span className="rounded-full bg-green-100/60 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
        {t.mktConnected}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-nordic-600/10 px-3 py-1 text-xs font-medium text-nordic-600 dark:bg-nordic-600/20">
      {t.mktRequestSent}
    </span>
  );
}

export function AccountantMarketplace({
  viewerAccountantId,
  compact = false,
  profileBasePath = "/dashboard/marketplace",
}: Props) {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [rows, setRows] = useState<AccountantRow[]>([]);
  const [canRequest, setCanRequest] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "ok" | "error">("loading");
  const [busy, setBusy] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      if (city) p.set("city", city);
      if (compact) p.set("pageSize", "6");
      const res = await fetch(`/api/marketplace/accountants?${p}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.accountants ?? []);
      setCanRequest(data.viewerCanRequest ?? false);
      setLoadState("ok");
    } catch {
      setLoadState("error");
    }
  }, [q, city, compact]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(load, 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [load]);

  async function sendRequest(accountantId: string) {
    setBusy(accountantId);
    try {
      const res = await fetch("/api/accountant/connection-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountantId }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(d.alreadyPending ? t.mktRequestAlreadyPending : t.mktRequestSent);
        setRows((prev) => prev.map((r) => r.id === accountantId ? { ...r, myStatus: "pending" } : r));
      } else if (res.status === 409 && d.alreadyConnected) {
        toast.info(t.mktAlreadyConnected);
        setRows((prev) => prev.map((r) => r.id === accountantId ? { ...r, myStatus: "active" } : r));
      } else if (res.status === 409 && d.needsCompany) {
        toast.error(t.mktNeedsCompany);
      } else if (res.status === 403) {
        toast.error(t.mktOwnerOnly);
      } else {
        toast.error(d.error ?? t.mktRequestError);
      }
    } catch {
      toast.error(t.mktRequestError);
    } finally {
      setBusy(null);
    }
  }

  const hasFilters = !!(q || city);

  return (
    <div className="space-y-5">
      {/* Search + filters */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              strokeWidth={2}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.mktSearchPlaceholder}
              aria-label={t.mktSearchLabel}
              className="w-full rounded-xl border border-gray-900/[0.12] bg-white py-2.5 pl-10 pr-9 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white dark:placeholder:text-gray-600"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                aria-label={t.mktClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="relative w-40">
            <MapPin
              className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
              strokeWidth={2}
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t.mktCityPlaceholder}
              aria-label={t.mktCityLabel}
              className="w-full rounded-xl border border-gray-900/[0.10] bg-white py-2.5 pl-8 pr-8 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.10] dark:bg-[#111] dark:text-white dark:placeholder:text-gray-600"
            />
            {city && (
              <button
                onClick={() => setCity("")}
                aria-label={t.mktClearCity}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {hasFilters && (
            <button
              onClick={() => { setQ(""); setCity(""); }}
              className="shrink-0 rounded-xl border border-gray-900/[0.10] px-3 py-2.5 text-sm text-gray-500 transition hover:bg-gray-50 dark:border-white/[0.10] dark:hover:bg-white/[0.06]"
            >
              {t.mktClear}
            </button>
          )}
        </div>
      )}

      {/* Result count */}
      {!compact && loadState === "ok" && rows.length > 0 && (
        <p className="text-xs text-gray-400">
          {(rows.length === 1 ? t.mktResultsOne : t.mktResultsMany).replace("{n}", String(rows.length))}
        </p>
      )}

      {/* Skeleton */}
      {loadState === "loading" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(compact ? 3 : 6)].map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-2xl border border-gray-900/[0.07] bg-gray-100 dark:border-white/[0.06] dark:bg-white/[0.04]"
            />
          ))}
        </div>
      ) : loadState === "error" ? (
        <p className="text-sm text-red-600">{t.mktLoadError}</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 px-8 py-14 text-center backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.mktEmpty}</p>
          {hasFilters && (
            <button
              onClick={() => { setQ(""); setCity(""); }}
              className="mt-2 text-sm text-nordic-600 hover:underline"
            >
              {t.mktClearFilters}
            </button>
          )}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((a, i) => {
              const isSelf = a.id === viewerAccountantId;
              return (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className="group relative flex flex-col rounded-2xl border border-gray-900/[0.07] bg-white transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.09)] dark:border-white/[0.08] dark:bg-[#0D0D0D] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                >
                  {/* Full-card link underneath */}
                  <Link
                    href={`${profileBasePath}/${a.id}`}
                    className="absolute inset-0 rounded-2xl"
                    aria-label={t.mktViewProfile.replace("{name}", a.name ?? a.email)}
                  />

                  <div className="flex flex-1 flex-col gap-4 p-5">
                    {/* Header: avatar + name + rating */}
                    <div className="flex items-start gap-3">
                      <Avatar
                        name={a.name}
                        email={a.email}
                        logoUrl={a.logoUrl}
                        firmLogoUrl={a.firmLogoUrl}
                        firmName={a.firmName}
                        isBoosted={a.isBoosted}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-display text-[15px] font-semibold text-gray-900 dark:text-white">
                            {a.name ?? a.email}
                          </span>
                          {a.isBoosted && (
                            <span className="rounded-full bg-nordic-600/10 px-1.5 py-px text-[10px] font-bold uppercase tracking-widest text-nordic-600 dark:bg-nordic-600/20">
                              {t.mktBoosted}
                            </span>
                          )}
                          {isSelf && (
                            <span className="rounded-full bg-gray-100 px-1.5 py-px text-[10px] font-medium text-gray-500 dark:bg-white/[0.08] dark:text-gray-400">
                              {t.mktYou}
                            </span>
                          )}
                        </div>
                        {a.firmName && (
                          <span className="mt-0.5 block text-xs font-medium text-nordic-600/80 dark:text-nordic-400/80">
                            {a.firmName}
                          </span>
                        )}
                        {a.city && (
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="h-3 w-3 shrink-0" strokeWidth={2} />
                            {a.city}
                          </span>
                        )}
                      </div>

                      {/* Rating — top-right, prominent like app store */}
                      {a.avgRating != null && a.reviewCount > 0 ? (
                        <RatingBadge rating={a.avgRating} count={a.reviewCount} />
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <Star className="h-5 w-5 text-gray-200 dark:text-gray-700" strokeWidth={1.5} />
                          <span className="text-[10px] text-gray-300 dark:text-gray-600">{t.mktNew}</span>
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    {a.bio && (
                      <p className="line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        {a.bio}
                      </p>
                    )}

                    {/* Specialization tags */}
                    {a.specializations && a.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {a.specializations.slice(0, 4).map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-[#F1ECE0] px-2.5 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-white/[0.07] dark:text-gray-400"
                          >
                            {s}
                          </span>
                        ))}
                        {a.specializations.length > 4 && (
                          <span className="rounded-full bg-gray-100/80 px-2.5 py-0.5 text-[11px] text-gray-400 dark:bg-white/[0.05]">
                            +{a.specializations.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="mt-auto flex items-center gap-4 border-t border-gray-900/[0.05] pt-3 dark:border-white/[0.05]">
                      {a.activeClientCount > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Users className="h-3 w-3 shrink-0" strokeWidth={2} />
                          {(a.activeClientCount === 1 ? t.mktClientsOne : t.mktClientsMany).replace("{n}", String(a.activeClientCount))}
                        </span>
                      )}
                      {a.joinedYear && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <CalendarDays className="h-3 w-3 shrink-0" strokeWidth={2} />
                          {t.mktSince.replace("{year}", String(a.joinedYear))}
                        </span>
                      )}
                      {!a.activeClientCount && !a.joinedYear && (
                        <span className="text-[11px] text-gray-300 dark:text-gray-600">{t.mktNewAccountant}</span>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="relative">
                      {a.myStatus === "active" ? (
                        <StatusBadge status="active" />
                      ) : a.myStatus === "pending" ? (
                        <StatusBadge status="pending" />
                      ) : !isSelf && canRequest ? (
                        <button
                          disabled={busy === a.id}
                          onClick={(e) => { e.preventDefault(); sendRequest(a.id); }}
                          className="relative z-10 w-full rounded-xl bg-nordic-600 py-2 text-sm font-medium text-white transition-colors hover:bg-nordic-700 active:scale-[0.98] disabled:opacity-60"
                        >
                          {busy === a.id ? t.mktSending : t.mktSendRequest}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
