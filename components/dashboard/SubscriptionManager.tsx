"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS, SELECTABLE_PLANS, planFeatures, planName, planPrice } from "@/lib/plans";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export function SubscriptionManager({
  currentTier,
  periodEnd,
  hasBilling = false,
}: {
  currentTier: string;
  periodEnd: string | null;
  hasBilling?: boolean;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const { t } = useLanguage();
  const router = useRouter();

  const selfServe = SELECTABLE_PLANS.filter((p) => p.tier !== "enterprise");
  const enterprise = SELECTABLE_PLANS.find((p) => p.tier === "enterprise");

  async function upgrade(tier: "starter" | "pro" | "business" | "max") {
    setLoading(tier);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else if (res.ok && data.switched) {
        // Existing subscription was updated in place - no checkout needed.
        toast.success(t.toastPlanSwitched);
        setLoading(null);
        router.refresh();
      } else {
        toast.error(data.error ?? t.toastCheckoutFail);
        setLoading(null);
      }
    } catch {
      toast.error(t.toastNetwork);
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/subscription/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      toast.error(data.error ?? t.toastPortalFail);
    } catch {
      toast.error(t.toastNetwork);
    }
    setLoading(null);
  }

  async function cancel() {
    setLoading("cancel");
    const res = await fetch("/api/subscription/cancel", { method: "POST" });
    if (res.ok) {
      toast.success(t.toastCancelScheduled);
      setShowCancel(false);
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error ?? t.toastCancelFail);
    }
    setLoading(null);
  }

  const current = PLANS.find((p) => p.tier === currentTier);

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showCancel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              exit={{ y: 20 }}
              className="panel w-full max-w-md rounded-[1.5rem] p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.cancelTitle}</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t.cancelIntro}</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• {t.cancelBullet1Pre}<strong>{t.cancelBullet1Strong}</strong>{t.cancelBullet1Post}</li>
                <li>• {t.cancelBullet2Pre}<strong>{t.cancelBullet2Strong}</strong>{t.cancelBullet2Post}</li>
                <li>• {t.cancelBullet3Pre}<strong>{t.cancelBullet3Strong}</strong>{t.cancelBullet3Post}</li>
              </ul>
              <label className="mt-4 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5" />
                <span>{t.cancelAccept}</span>
              </label>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCancel(false)} disabled={loading !== null}>
                  {t.cancelAbort}
                </Button>
                <Button variant="destructive" onClick={cancel} disabled={!accepted || loading !== null}>
                  {loading === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : t.cancelConfirm}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel rounded-2xl transition-shadow hover:shadow-sm"
      >
        <CardHeader>
          <CardTitle className="font-display text-lg text-gray-900 dark:text-white">{t.subCurrentPlan}</CardTitle>
          <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
            {t.subYouAreOnPre}{current ? planName(t, current.tier) : currentTier}{t.subYouAreOnPost}
            {periodEnd ? ` · ${t.subRenews} ${new Date(periodEnd).toLocaleDateString()}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{current ? planPrice(t, current) : "-"}</p>
          <div className="flex flex-wrap items-center gap-2">
            {hasBilling && (
              <Button variant="outline" onClick={openPortal} disabled={loading !== null}>
                {loading === "portal" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t.subManageBilling}
                  </>
                )}
              </Button>
            )}
            {currentTier !== "free" && currentTier !== "enterprise" && (
              <Button variant="outline" onClick={() => { setAccepted(false); setShowCancel(true); }} disabled={loading !== null}>
                {t.subCancel}
              </Button>
            )}
          </div>
        </CardContent>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {selfServe.map((plan, index) => {
          const isCurrent = plan.tier === currentTier;
          return (
            <motion.div
              key={plan.tier}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "panel flex flex-col rounded-2xl p-6",
                isCurrent && "ring-2 ring-nordic-600",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">{planName(t, plan.tier)}</h3>
                {isCurrent && <Badge className="bg-nordic-600 text-white">{t.subCurrentBadge}</Badge>}
              </div>
              <p className="mt-2 whitespace-nowrap text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{planPrice(t, plan)}</p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm text-gray-600 dark:text-gray-300">
                {planFeatures(t, plan.tier).map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-nordic-600" strokeWidth={1.75} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                variant={isCurrent ? "outline" : "default"}
                disabled={isCurrent || loading !== null}
                onClick={() => upgrade(plan.tier as "starter" | "pro" | "business" | "max")}
              >
                {loading === plan.tier ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCurrent ? (
                  t.subCurrentBadge
                ) : (
                  `${t.subSwitchTo} ${planName(t, plan.tier)}`
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {enterprise && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: selfServe.length * 0.05 }}
          className={cn(
            "panel flex flex-col gap-5 rounded-2xl p-6 md:flex-row md:items-center md:justify-between",
            currentTier === "enterprise" && "ring-2 ring-nordic-600",
          )}
        >
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">{planName(t, enterprise.tier)}</h3>
              {currentTier === "enterprise" && <Badge className="bg-nordic-600 text-white">{t.subCurrentBadge}</Badge>}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
              {planFeatures(t, enterprise.tier).map((f) => (
                <li key={f} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-nordic-600" strokeWidth={1.75} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-6 md:justify-end">
            <p className="whitespace-nowrap text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{planPrice(t, enterprise)}</p>
            {currentTier !== "enterprise" && (
              <Button
                variant="outline"
                disabled={loading !== null}
                onClick={async () => {
                  setLoading("enterprise");
                  const r = await fetch("/api/billing/enterprise-inquiry", { method: "POST" });
                  setLoading(null);
                  if (r.ok) toast.success(t.toastQuoteThanks);
                  else window.location.href = "mailto:sales@kvittino.se?subject=Enterprise";
                }}
              >
                {loading === "enterprise" ? <Loader2 className="h-4 w-4 animate-spin" /> : t.subRequestQuote}
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
