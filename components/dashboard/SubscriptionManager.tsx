"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS, SELECTABLE_PLANS } from "@/lib/plans";
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

  const planName = (n: string) =>
    ({
      Gratis: t.planFree,
      Pro: t.planPro,
      "Företag": t.planBusiness,
      Enterprise: t.planEnterprise,
    } as Record<string, string>)[n] ?? n;

  const priceLbl = (l: string) => (l === "Offert" ? t.planQuote : l);

  const featLbl = (f: string) =>
    (({
      "Obegränsade skanningar": t.featUnlimitedScans,
      "25 skanningar/mån": t.feat25Scans,
      "Grundläggande OCR": t.featBasicOcr,
      "CSV-export": t.featCsv,
      "Fortnox-integration": t.featFortnox,
      "Svensk moms (6/12/25 %)": t.featSwedishVat,
      "7-årig revisionslogg": t.featAuditLog,
      "Allt i Pro": t.featAllPro,
      "Attestflöden": t.featApprovals,
      "Milersättning": t.featMileage,
      "Koldioxidavtryck": t.featCarbon,
      "Allt i Företag": t.featAllBusiness,
    } as Record<string, string>)[f] ?? f);

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
        // Existing subscription was updated in place — no checkout needed.
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
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-[#111]"
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
        className="rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm transition-shadow hover:shadow-sm dark:border-white/[0.07] dark:bg-[#0D0D0D]"
      >
        <CardHeader>
          <CardTitle className="font-display text-lg text-gray-900 dark:text-white">{t.subCurrentPlan}</CardTitle>
          <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
            {t.subYouAreOnPre}{planName(current?.name ?? currentTier)}{t.subYouAreOnPost}
            {periodEnd ? ` · ${t.subRenews} ${new Date(periodEnd).toLocaleDateString()}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{current ? priceLbl(current.priceLabel) : "—"}</p>
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {SELECTABLE_PLANS.map((plan, index) => {
          const isCurrent = plan.tier === currentTier;
          const upgradable =
            plan.tier === "starter" ||
            plan.tier === "pro" ||
            plan.tier === "business" ||
            plan.tier === "max";
          return (
            <motion.div
              key={plan.tier}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className={cn(
                "flex flex-col rounded-2xl border bg-white/60 backdrop-blur-sm transition-shadow hover:shadow-sm dark:bg-[#0D0D0D]",
                isCurrent ? "ring-2 ring-nordic-600" : "border-gray-900/[0.07] dark:border-white/[0.07]",
              )}
            >
              <Card className="flex flex-1 flex-col border-0 bg-transparent shadow-none">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-lg text-gray-900 dark:text-white">{planName(plan.name)}</CardTitle>
                    {isCurrent && <Badge className="bg-nordic-600 text-white">{t.subCurrentBadge}</Badge>}
                  </div>
                  <CardDescription className="text-lg font-semibold text-gray-900 dark:text-white">{priceLbl(plan.priceLabel)}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-4">
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((f, i) => (
                      <motion.li
                        key={f}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-start gap-2"
                      >
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.03 + 0.1, type: "spring" }}
                          className="text-green-500"
                        >
                          ✓
                        </motion.span>
                        <span>{featLbl(f)}</span>
                      </motion.li>
                    ))}
                  </ul>
                  {!isCurrent && upgradable && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full"
                      onClick={() => upgrade(plan.tier as "starter" | "pro" | "business" | "max")}
                      disabled={loading !== null}
                    >
                      <Button className="w-full" disabled={loading !== null}>
                        {loading === plan.tier ? <Loader2 className="h-4 w-4 animate-spin" /> : `${t.subSwitchTo} ${planName(plan.name)}`}
                      </Button>
                    </motion.button>
                  )}
                  {plan.tier === "enterprise" && !isCurrent && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full"
                      disabled={loading !== null}
                      onClick={async () => {
                        setLoading("enterprise");
                        const r = await fetch("/api/billing/enterprise-inquiry", { method: "POST" });
                        setLoading(null);
                        if (r.ok) toast.success(t.toastQuoteThanks);
                        else window.location.href = "mailto:sales@utlagg.se?subject=Enterprise";
                      }}
                    >
                      <Button variant="outline" className="w-full" disabled={loading !== null}>
                        {loading === "enterprise" ? <Loader2 className="h-4 w-4 animate-spin" /> : t.subRequestQuote}
                      </Button>
                    </motion.button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}