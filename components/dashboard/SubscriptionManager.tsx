"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/plans";

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
        toast.error(data.error ?? "Kunde inte starta betalning");
        setLoading(null);
      }
    } catch {
      toast.error("Nätverksfel");
      setLoading(null);
    }
  }

  async function cancel() {
    setLoading("cancel");
    const res = await fetch("/api/subscription/cancel", { method: "POST" });
    if (res.ok) {
      toast.success("Prenumerationen avslutas vid periodens slut.");
      setShowCancel(false);
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error ?? "Kunde inte avsluta prenumeration");
    }
    setLoading(null);
  }

  const current = PLANS.find((p) => p.tier === currentTier);

  return (
    <div className="space-y-6">
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Avsluta prenumeration?</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Innan du avslutar, läs och godkänn följande:</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• Vi sparar dina kvitton och fakturor i <strong>1 år efter din senaste betalning</strong>. Därefter raderas de.</li>
              <li>• Du kan <strong>inte skanna nya kvitton</strong> utan en aktiv prenumeration.</li>
              <li>• Har du ett företag med anställda kan du behöva <strong>ta bort medlemmar</strong> om du går ner i plan.</li>
            </ul>
            <label className="mt-4 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5" />
              <span>Jag förstår och godkänner att min data raderas efter 1 år.</span>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCancel(false)} disabled={loading !== null}>Avbryt</Button>
              <Button variant="destructive" onClick={cancel} disabled={!accepted || loading !== null}>
                {loading === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Avsluta ändå"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nuvarande plan</CardTitle>
          <CardDescription>
            Du är på {current?.name ?? currentTier}-planen
            {periodEnd ? ` · förnyas ${new Date(periodEnd).toLocaleDateString("sv-SE")}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-2xl font-bold">{current?.priceLabel ?? "—"}</p>
          {currentTier !== "free" && currentTier !== "enterprise" && (
            <Button variant="outline" onClick={() => { setAccepted(false); setShowCancel(true); }} disabled={loading !== null}>
              Avsluta prenumeration
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
                  <CardTitle>{plan.name}</CardTitle>
                  {isCurrent && <Badge className="bg-nordic-600 text-white">Nuvarande</Badge>}
                </div>
                <CardDescription className="text-lg font-semibold text-gray-900 dark:text-white">
                  {plan.priceLabel}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-green-500">✓</span> {f}
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
                      `Byt till ${plan.name}`
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
                      if (r.ok) toast.success("Tack! Vi hör av oss om en offert.");
                      else window.location.href = "mailto:sales@utlagg.se?subject=Enterprise";
                    }}
                  >
                    {loading === "enterprise" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Begär offert"}
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
