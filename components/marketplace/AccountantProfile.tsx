"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MapPin, MessageSquare } from "lucide-react";
import { AccountantChat } from "@/components/AccountantChat";
import { LogoUploader } from "@/components/dashboard/LogoUploader";
import { useLanguage } from "@/context/LanguageContext";

interface Review {
  id: string;
  companyName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface FirmMember {
  id: string;
  name: string | null;
  email: string;
  logoUrl: string | null;
  role: string;
}

interface Firm {
  id: string;
  name: string;
  logoUrl: string | null;
  members: FirmMember[];
}

interface ProfileData {
  accountant: {
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
  };
  reviews: Review[];
  myStatus: string | null;
  clientId: string | null;
  viewerCanRequest: boolean;
  viewerCanReview: boolean;
  viewerExistingReview: { rating: number; comment: string | null } | null;
  firm: Firm | null;
}

function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  const { t } = useLanguage();
  return (
    <span className="text-nordic-600" aria-label={t.profStarsLabel.replace("{rating}", String(rating)).replace("{max}", String(max))}>
      {"★".repeat(Math.round(rating))}
      {"☆".repeat(max - Math.round(rating))}
    </span>
  );
}


/** Rename and/or set the logo of the caller's firm. Owner/admin only — enforced server-side. Toasts on failure. */
async function patchFirm(body: { name?: string; logoUrl?: string | null }, errorMsg: string): Promise<boolean> {
  const res = await fetch("/api/accountant/firm", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) return true;
  const d = await res.json().catch(() => ({}));
  toast.error(d.error ?? errorMsg);
  return false;
}

function FirmSidebar({ firm }: { firm: Firm }) {
  const { t } = useLanguage();
  const roleLabels: Record<string, string> = { owner: t.teamRoleOwner, admin: t.teamRoleAdmin, member: t.profRoleMember };
  return (
    <div className="self-start lg:sticky lg:top-6 space-y-4">
      <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-5 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
        {/* Firm header */}
        <div className="mb-4 flex items-center gap-3">
          {firm.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={firm.logoUrl}
              alt={firm.name}
              className="h-12 w-12 shrink-0 rounded-xl border border-gray-900/[0.07] object-contain dark:border-white/[0.08]"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-nordic-600/10 text-lg font-bold text-nordic-600">
              {firm.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{t.profFirm}</p>
            <p className="font-semibold text-gray-900 dark:text-white">{firm.name}</p>
          </div>
        </div>

        {/* Members list */}
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
          {t.profMembers.replace("{n}", String(firm.members.length))}
        </p>
        <ul className="space-y-2">
          {firm.members.map((m) => (
            <li key={m.id} className="flex items-center gap-2.5">
              {m.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.logoUrl}
                  alt={m.name ?? m.email}
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nordic-600/10 text-sm font-bold text-nordic-600">
                  {(m.name ?? m.email).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-900 dark:text-white">{m.name ?? m.email}</p>
              </div>
              <span className="shrink-0 rounded-full bg-gray-100/80 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-white/[0.08] dark:text-gray-400">
                {roleLabels[m.role] ?? m.role}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface Props {
  accountantId: string;
  /** If set and matches accountantId, shows inline profile editor. */
  viewerAccountantId?: string;
  /** Back-link href (e.g. "/dashboard/marketplace" or "/accountant/marketplace"). */
  backHref: string;
  /** The signed-in user's id — needed to align chat bubbles. */
  currentUserId?: string;
}

export function AccountantProfile({ accountantId, viewerAccountantId, backHref, currentUserId }: Props) {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<ProfileData | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "ok" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  // Inline edit state (accountant's own profile)
  const [editing, setEditing] = useState(false);
  const [editCity, setEditCity] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editSpecializations, setEditSpecializations] = useState("");
  const [editFirmName, setEditFirmName] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const res = await fetch(`/api/marketplace/accountants/${accountantId}`);
      if (!res.ok) throw new Error();
      const d: ProfileData = await res.json();
      setData(d);
      setLoadState("ok");
      if (d.viewerExistingReview) {
        setReviewRating(d.viewerExistingReview.rating);
        setReviewComment(d.viewerExistingReview.comment ?? "");
      }
      setEditCity(d.accountant.city ?? "");
      setEditBio(d.accountant.bio ?? "");
      setEditSpecializations((d.accountant.specializations ?? []).join(", "));
      setEditFirmName(d.firm?.name ?? "");
    } catch {
      setLoadState("error");
    }
  }, [accountantId]);

  useEffect(() => { load(); }, [load]);

  async function sendRequest() {
    setBusy(true);
    try {
      const res = await fetch("/api/accountant/connection-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountantId }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(d.alreadyPending ? t.mktRequestAlreadyPending : t.mktRequestSent);
        setData((prev) => prev ? { ...prev, myStatus: "pending" } : prev);
      } else if (res.status === 409 && d.alreadyConnected) {
        toast.info(t.mktAlreadyConnected);
        setData((prev) => prev ? { ...prev, myStatus: "active" } : prev);
      } else {
        toast.error(d.error ?? t.mktRequestError);
      }
    } catch {
      toast.error(t.mktRequestError);
    } finally {
      setBusy(false);
    }
  }

  async function submitReview() {
    setReviewSubmitting(true);
    try {
      const res = await fetch(`/api/marketplace/accountants/${accountantId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment || null }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(t.profReviewSaved);
        load();
      } else {
        toast.error(d.error ?? t.profReviewSaveError);
      }
    } catch {
      toast.error(t.profReviewSaveError);
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function saveProfile() {
    setEditSaving(true);
    try {
      const specializations = editSpecializations
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/marketplace/accountants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountantCity: editCity || null,
          accountantBio: editBio || null,
          accountantSpecializations: specializations.length ? specializations : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error ?? t.toastSaveFail);
        return;
      }
      const firmName = editFirmName.trim();
      if (data?.firm && firmName && firmName !== data.firm.name && !(await patchFirm({ name: firmName }, t.profFirmSaveError))) return;
      toast.success(t.profSaved);
      setEditing(false);
      load();
    } catch {
      toast.error(t.toastSaveFail);
    } finally {
      setEditSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white dark:placeholder:text-gray-600";

  if (loadState === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
      </div>
    );
  }
  if (loadState === "error" || !data) {
    return <p className="text-sm text-red-600">{t.profLoadError}</p>;
  }

  const { accountant, reviews } = data;
  const isSelf = accountantId === viewerAccountantId;
  const viewerRole = data.firm?.members.find((m) => m.id === viewerAccountantId)?.role;
  const canManageFirm = viewerRole === "owner" || viewerRole === "admin";
  // Firm members are presented under the firm's picture (same rule as the marketplace cards)
  const heroLogo = data.firm?.logoUrl ?? accountant.logoUrl;
  const heroAlt = data.firm?.logoUrl ? data.firm.name : (accountant.name ?? accountant.email);
  const heroInitial = (data.firm?.name ?? accountant.name ?? accountant.email).charAt(0).toUpperCase();
  const labelClass = "mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500";

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white"
      >
        {t.profBack}
      </Link>

      <div className={data.firm ? "lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_320px]" : "space-y-8"}>
      <div className="space-y-8">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 rounded-2xl border border-gray-900/[0.07] bg-white/60 p-6 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D] sm:flex-row sm:items-start"
      >
        {/* Avatar */}
        {heroLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroLogo}
            alt={heroAlt}
            className="h-20 w-20 shrink-0 rounded-xl border border-gray-900/[0.07] object-contain dark:border-white/[0.08]"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-nordic-600/10 text-2xl font-bold text-nordic-600">
            {heroInitial}
          </div>
        )}

        {/* Content + CTA together so CTA never overflows card */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
                {accountant.name ?? accountant.email}
              </h1>
              {accountant.isBoosted && (
                <span className="rounded-full bg-nordic-600/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-nordic-600 dark:bg-nordic-600/20">
                  {t.mktBoosted}
                </span>
              )}
            </div>

            {/* CTA — inside content col, no risk of overflowing card */}
            <div className="shrink-0">
              {isSelf ? (
                <button
                  onClick={() => setEditing((v) => !v)}
                  className="rounded-full border border-gray-900/[0.12] px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 active:scale-[0.98] dark:border-white/[0.12] dark:text-gray-300 dark:hover:bg-white/[0.06]"
                >
                  {editing ? t.btnCancel : t.profEdit}
                </button>
              ) : data.myStatus === "active" ? (
                <span className="rounded-full bg-green-100/50 px-3 py-1.5 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
                  {t.mktConnected}
                </span>
              ) : data.myStatus === "pending" ? (
                <span className="rounded-full bg-nordic-600/10 px-3 py-1.5 text-sm font-medium text-nordic-600 dark:bg-nordic-600/20">
                  {t.mktRequestSent}
                </span>
              ) : data.viewerCanRequest ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={busy}
                  onClick={sendRequest}
                  className="rounded-full bg-nordic-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-nordic-700 disabled:opacity-60"
                >
                  {busy ? t.mktSending : t.mktSendRequest}
                </motion.button>
              ) : null}
            </div>
          </div>

          {accountant.city && (
            <p className="flex items-center gap-1 text-sm text-gray-400">
              <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              {accountant.city}
            </p>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 pt-1 text-sm text-gray-500 dark:text-gray-400">
            {accountant.avgRating != null && (
              <span className="flex items-center gap-1">
                <Stars rating={accountant.avgRating} />
                <span>{accountant.avgRating.toFixed(1)}</span>
                <span className="text-gray-400">({accountant.reviewCount})</span>
              </span>
            )}
            {accountant.activeClientCount > 0 && (
              <span>{t.profClientsCount.replace("{n}", String(accountant.activeClientCount))}</span>
            )}
          </div>

          {accountant.specializations && accountant.specializations.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {accountant.specializations.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-gray-900/[0.08] px-2.5 py-0.5 text-[11px] text-gray-500 dark:border-white/[0.08] dark:text-gray-400"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Chat panel — visible when connected and toggled open */}
      <div ref={chatRef} />
      {data.myStatus === "active" && data.clientId && currentUserId && chatOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          <AccountantChat clientId={data.clientId} currentUserId={currentUserId} />
        </motion.div>
      )}

      {/* FAB — sticky message shortcut when connected */}
      {data.myStatus === "active" && data.clientId && currentUserId && (
        <motion.button
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", bounce: 0, duration: 0.35 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setChatOpen((v) => {
              if (!v) chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              return !v;
            });
          }}
          className="fixed right-6 z-50 flex items-center gap-2 rounded-full bg-nordic-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-nordic-600/30 transition-colors hover:bg-nordic-700"
          style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <MessageSquare size={16} />
          {chatOpen ? t.profCloseChat : t.profMessage}
        </motion.button>
      )}

      {/* Inline profile editor (own profile only) */}
      {isSelf && editing && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-6 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.profEdit}</h2>
          <p className="mb-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t.profEditNameHintPre}{" "}
            <Link href="/accountant/settings" className="text-nordic-600 hover:underline">{t.navSettings}</Link>.
          </p>
          <div className="space-y-3">
            {data.firm && (canManageFirm ? (
              <div className="space-y-3 border-b border-gray-900/[0.07] pb-4 dark:border-white/[0.08]">
                <div>
                  <label htmlFor="firm-name" className={labelClass}>{t.profFirmName}</label>
                  <input
                    id="firm-name"
                    value={editFirmName}
                    onChange={(e) => setEditFirmName(e.target.value)}
                    maxLength={255}
                    className={inputClass}
                  />
                </div>
                <div>
                  <p className={labelClass}>{t.profFirmLogo}</p>
                  <LogoUploader
                    value={data.firm.logoUrl}
                    label={data.firm.name}
                    onSave={async (logoUrl) => {
                      if (!(await patchFirm({ logoUrl }, t.profFirmSaveError))) throw new Error();
                      setData((prev) => (prev?.firm ? { ...prev, firm: { ...prev.firm, logoUrl } } : prev));
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="border-b border-gray-900/[0.07] pb-4 text-sm text-gray-500 dark:border-white/[0.08] dark:text-gray-400">
                {t.profFirmOwnerOnly}
              </p>
            ))}
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
                {t.mktCityPlaceholder}
              </label>
              <input
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                placeholder="Stockholm"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
                {t.profBio}
              </label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={4}
                placeholder={t.profBioPlaceholder}
                className={`${inputClass} resize-none`}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
                {t.profSpecializations}
              </label>
              <input
                value={editSpecializations}
                onChange={(e) => setEditSpecializations(e.target.value)}
                placeholder={t.profSpecializationsPlaceholder}
                className={inputClass}
              />
            </div>
            <button
              onClick={saveProfile}
              disabled={editSaving}
              className="rounded-full bg-nordic-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-nordic-700 disabled:opacity-60"
            >
              {editSaving ? t.stSaving : t.btnSave}
            </button>
          </div>
        </motion.div>
      )}

      {/* Bio */}
      {accountant.bio && (
        <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-6 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">{t.profAbout}</h2>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{accountant.bio}</p>
        </div>
      )}

      {/* Reviews */}
      <div className="space-y-4">
        <h2 className="flex items-baseline gap-2 text-base font-semibold text-gray-900 dark:text-white">
          {t.profReviews}
          {accountant.reviewCount > 0 && (
            <span className="text-sm font-normal text-gray-400">({accountant.reviewCount})</span>
          )}
        </h2>

        {/* Submit / edit review form */}
        {data.viewerCanReview && (
          <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-5 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {data.viewerExistingReview ? t.profYourReview : t.profLeaveReview}
            </p>
            <div className="space-y-3">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setReviewRating(n)}
                    className={`text-2xl transition-transform hover:scale-110 ${n <= reviewRating ? "text-nordic-600" : "text-gray-300 dark:text-gray-600"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                placeholder={t.profCommentPlaceholder}
                className={`${inputClass} resize-none`}
              />
              <button
                onClick={submitReview}
                disabled={reviewSubmitting}
                className="rounded-full bg-nordic-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-nordic-700 disabled:opacity-60"
              >
                {reviewSubmitting ? t.stSaving : data.viewerExistingReview ? t.profUpdate : t.chatSend}
              </button>
            </div>
          </div>
        )}

        {reviews.length > 0 && (
          <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-5 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
            <div className="space-y-0.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                const active = ratingFilter === star;
                return (
                  <button
                    key={star}
                    onClick={() => setRatingFilter(active ? null : star)}
                    aria-pressed={active}
                    aria-label={t.profFilterStars.replace("{star}", String(star)).replace("{count}", String(count))}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-white/5 ${active ? "bg-nordic-600/10 ring-1 ring-inset ring-nordic-600/30 dark:bg-nordic-600/[0.16] dark:ring-nordic-600/40" : ""}`}
                  >
                    <span className="w-[4.5rem] shrink-0 select-none text-right text-xs">
                      <span className="text-nordic-600">{"★".repeat(star)}</span>
                      <span className="text-gray-300 dark:text-gray-600">{"☆".repeat(5 - star)}</span>
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                      <div
                        className="h-1.5 rounded-full bg-nordic-600 transition-[width] duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 shrink-0 text-right text-xs tabular-nums text-gray-400">{count}</span>
                  </button>
                );
              })}
            </div>
            {ratingFilter !== null && (
              <button
                onClick={() => setRatingFilter(null)}
                className="mt-3 text-xs text-nordic-600 hover:text-nordic-700 dark:text-nordic-400 dark:hover:text-nordic-300"
              >
                {t.mktClearFilters}
              </button>
            )}
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-8 text-center text-sm text-gray-500 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D] dark:text-gray-400">
            {t.profNoReviews}
          </div>
        ) : reviews.filter((r) => ratingFilter === null || r.rating === ratingFilter).length === 0 ? (
          <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-8 text-center text-sm text-gray-500 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D] dark:text-gray-400">
            {t.profNoStarReviews.replace("{star}", String(ratingFilter))}
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.filter((r) => ratingFilter === null || r.rating === ratingFilter).map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-5 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {r.companyName}
                    </p>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="shrink-0 text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString(lang === "en" ? "en-GB" : "sv-SE")}
                  </p>
                </div>
                {r.comment && (
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {r.comment}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      </div>
      {data.firm && <FirmSidebar firm={data.firm} />}
      </div>
    </div>
  );
}
