"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Shows the user's personal receipt-forwarding address (fetched from
 * /api/inbound/address, which mints the token on first view). Hidden when the
 * inbound domain isn't provisioned. Copy button, no scanning involved.
 */
export function EmailIntakeCard() {
  const { t } = useLanguage();
  const [address, setAddress] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/inbound/address")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setEnabled(Boolean(d.enabled && d.address));
        setAddress(d.address ?? null);
      })
      .catch(() => alive && setEnabled(false));
    return () => {
      alive = false;
    };
  }, []);

  // Nothing to show until we know, and skip entirely when not provisioned.
  if (enabled === false || !address) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.setEmailIntakeTitle}</CardTitle>
        <CardDescription>{t.setEmailIntakeDesc}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-xl border border-gray-900/15 bg-white px-3.5 py-2 text-sm text-gray-800 dark:border-white/[0.14] dark:bg-black/40 dark:text-gray-200">
          {address}
        </code>
        <Button variant="outline" onClick={copy} aria-live="polite">
          {copied ? t.btnCopied : t.btnCopy}
        </Button>
      </CardContent>
    </Card>
  );
}
