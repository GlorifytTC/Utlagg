"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/plans";
import { useLanguage } from "@/context/LanguageContext";

export function SubscriptionManager({
  currentTier,
  periodEnd,
}: {
  currentTier: string;
  periodEnd: string | null;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const { t } = useLanguage();
  const planName = (n: string) =>
    ({ Gratis: t.planFree, Pro: t.planPro, "Företag": t.planBusiness, Enterprise: t.planEnterprise } as Record<string, string>)[n] ?? n;
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

  async function upgrade(tier: "pro" | "business") {
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
      } else {
        toast.error(data.error ?? t.toastCheckoutFail);
        setLoading(null);
      }
    } catch {
      toast.error(t.toastNetwork);
      setLoading(null);
    }
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
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-900">
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
              <Button variant="outline" onClick={() => setShowCancel(false)} disabled={loading !== null}>{t.cancelAbort}</Button>
              <Button variant="destructive" onClick={cancel} disabled={!accepted || loading !== null}>
                {loading === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : t.cancelConfirm}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.subCurrentPlan}</CardTitle>
          <CardDescription>
            {t.subYouAreOnPre}{planName(current?.name ?? currentTier)}{t.subYouAreOnPost}
            {periodEnd ? ` · ${t.subRenews} ${new Date(periodEnd).toLocaleDateString()}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-2xl font-bold">{current ? priceLbl(current.priceLabel) : "—"}</p>
          {currentTier !== "free" && currentTier !== "enterprise" && (
            <Button variant="outline" onClick={() => { setAccepted(false); setShowCancel(true); }} disabled={loading !== null}>
              {t.subCancel}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.tier === currentTier;
          const upgradable = plan.tier === "pro" || plan.tier === "business";
          return (
            <Card key={plan.tier} className={isCurrent ? "ring-2 ring-nordic-500" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{planName(plan.name)}</CardTitle>
                  {isCurrent && <Badge className="bg-nordic-600 text-white">{t.subCurrentBadge}</Badge>}
                </div>
                <CardDescription className="text-lg font-semibold text-gray-900 dark:text-white">
                  {priceLbl(plan.priceLabel)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-green-500">✓</span> {featLbl(f)}
                    </li>
                  ))}
                </ul>
                {!isCurrent && upgradable && (
                  <Button
                    className="w-full"
                    onClick={() => upgrade(plan.tier as "pro" | "business")}
                    disabled={loading !== null}
                  >
                    {loading === plan.tier ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `${t.subSwitchTo} ${planName(plan.name)}`
                    )}
                  </Button>
                )}
                {plan.tier === "enterprise" && !isCurrent && (
                  <Button
                    variant="outline"
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
                    {loading === "enterprise" ? <Loader2 className="h-4 w-4 animate-spin" /> : t.subRequestQuote}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
