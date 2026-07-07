"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, ExternalLink, Loader2, ReceiptText } from "lucide-react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface InvoiceRow {
  id: string;
  number: string | null;
  created: number;
  amount: number;
  currency: string;
  status: string | null;
  hostedUrl: string | null;
  pdfUrl: string | null;
}

export function InvoiceHistory() {
  const [invoices, setInvoices] = useState<InvoiceRow[] | null>(null);
  const [error, setError] = useState(false);
  const { t, lang } = useLanguage();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscription/invoices")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setInvoices(data.invoices ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing to bill yet and nothing failed — don't render an empty card for
  // free-tier users who have never checked out.
  if (invoices !== null && invoices.length === 0 && !error) return null;

  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const fmtAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount / 100);

  const statusBadge = (status: string | null) => {
    if (status === "paid")
      return <Badge className="bg-green-600 text-white">{t.invStatusPaid}</Badge>;
    if (status === "open")
      return <Badge className="bg-amber-500 text-white">{t.invStatusOpen}</Badge>;
    return <Badge className="bg-red-600 text-white">{t.invStatusFailed}</Badge>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm transition-shadow hover:shadow-sm dark:border-white/[0.07] dark:bg-[#0D0D0D]"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-lg text-gray-900 dark:text-white">
          <ReceiptText className="h-5 w-5 text-nordic-600" />
          {t.invHistoryTitle}
        </CardTitle>
        <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
          {t.invHistoryDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.invLoadFail}</p>
        ) : invoices === null ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-900/[0.07] text-left text-xs uppercase tracking-wide text-gray-500 dark:border-white/[0.07] dark:text-gray-400">
                  <th className="pb-2 pr-4 font-medium">{t.invColDate}</th>
                  <th className="pb-2 pr-4 font-medium">{t.invColNumber}</th>
                  <th className="pb-2 pr-4 font-medium">{t.invColAmount}</th>
                  <th className="pb-2 pr-4 font-medium">{t.invColStatus}</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      "text-gray-700 dark:text-gray-200",
                      i > 0 && "border-t border-gray-900/[0.05] dark:border-white/[0.05]",
                    )}
                  >
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {new Date(inv.created).toLocaleDateString(locale)}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                      {inv.number ?? "—"}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {fmtAmount(inv.amount, inv.currency)}
                    </td>
                    <td className="py-3 pr-4">{statusBadge(inv.status)}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {inv.status === "open" && inv.hostedUrl && (
                          <a
                            href={inv.hostedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-nordic-600 hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {t.invPay}
                          </a>
                        )}
                        {inv.pdfUrl && (
                          <a
                            href={inv.pdfUrl}
                            className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{t.invDownload}</span>
                          </a>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </motion.div>
  );
}
