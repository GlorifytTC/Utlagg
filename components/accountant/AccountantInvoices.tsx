"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import type { InvoiceIncomeSummary } from "@/lib/invoice-income";
import { StatGrid } from "@/components/ui/stat";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { formatDate, formatSek } from "@/lib/utils";

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  buyerName: string;
  issueDate: string;
  dueDate: string | null;
  total: string;
  currency: string;
  status: string;
}

const kr = (n: unknown) => formatSek(Number(n) || 0);

/** Read-only list of a client's customer invoices. Each row opens the printable sheet. */
export function AccountantInvoices({ companyId }: { companyId: string }) {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [summary, setSummary] = useState<InvoiceIncomeSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    fetch(`/api/accountant/clients/${companyId}/invoices`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setRows(d.invoices ?? []);
        setSummary(d.summary ?? null);
        setStatus("ok");
      })
      .catch(() => setStatus("error"));
  }, [companyId]);

  if (status === "loading") {
    return (
      <div className="space-y-2" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-12 rounded-xl" />
        ))}
      </div>
    );
  }
  if (status === "error") return <ErrorState>{t.ivLoadError}</ErrorState>;
  if (rows.length === 0) {
    return <div className="rounded-2xl panel p-10 text-center text-sm text-gray-500 dark:text-gray-400">{t.ivEmpty}</div>;
  }

  const th = "px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400";
  const td = "px-5 py-3 text-sm text-gray-500 dark:text-gray-400";

  return (
    <div className="space-y-4">
      {summary && (
        <StatGrid
          items={[
            { label: t.ivIncome, value: kr(summary.incomeNet) },
            { label: t.ivVat, value: kr(summary.vatToRemit) },
            {
              label: t.ivOutstanding,
              value: kr(summary.outstandingGross),
              tone: Number(summary.outstandingGross) > 0 ? "warn" : "default",
            },
          ]}
        />
      )}

      <div className="overflow-hidden rounded-2xl panel">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className={th}>{t.ivColNr}</th>
                <th className={th}>{t.ivColCustomer}</th>
                <th className={th}>{t.ivColDate}</th>
                <th className={th}>{t.ivColDue}</th>
                <th className={`${th} text-right`}>{t.ivColTotal}</th>
                <th className={th}>{t.ivColStatus}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-gray-900/[0.07] transition-colors hover:bg-gray-900/[0.02] dark:border-white/[0.07] dark:hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3 text-sm font-medium">
                    <Link href={`/accountant/clients/${companyId}/invoices/${r.id}`} className="inline-flex min-h-11 items-center rounded-full text-nordic-600 transition hover:text-nordic-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 dark:text-nordic-300">
                      {r.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-900 dark:text-white">{r.buyerName}</td>
                  <td className={td}>{formatDate(r.issueDate, lang)}</td>
                  <td className={td}>{formatDate(r.dueDate, lang)}</td>
                  <td className={`${td} text-right tabular-nums`}>{kr(r.total)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={r.status === "paid" ? "success" : "warning"}>
                      {r.status === "paid" ? t.ivPaid : t.ivUnpaid}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-gray-900/[0.07] dark:divide-white/[0.07] md:hidden">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/accountant/clients/${companyId}/invoices/${r.id}`} className="flex min-h-[56px] items-center gap-3 p-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-nordic-600/20">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    #{r.invoiceNumber} · {r.buyerName}
                  </p>
                  <p className="text-xs tabular-nums text-gray-500 dark:text-gray-400">{kr(r.total)}</p>
                </div>
                <Badge tone={r.status === "paid" ? "success" : "warning"} className="shrink-0">
                  {r.status === "paid" ? t.ivPaid : t.ivUnpaid}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
