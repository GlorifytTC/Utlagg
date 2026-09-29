"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import type { InvoiceIncomeSummary } from "@/lib/invoice-income";

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

const money = new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const kr = (n: unknown) => `${money.format(Number(n) || 0)} kr`;

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
      <div className="flex items-center justify-center p-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
      </div>
    );
  }
  if (status === "error") return <p className="text-sm text-red-600">{t.ivLoadError}</p>;
  if (rows.length === 0) {
    return <div className="rounded-2xl panel p-10 text-center text-sm text-gray-500 dark:text-gray-400">{t.ivEmpty}</div>;
  }

  const th = "px-5 py-3 text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400";
  const td = "px-5 py-3 text-sm text-gray-500 dark:text-gray-400";

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            [t.ivIncome, summary.incomeNet],
            [t.ivVat, summary.vatToRemit],
            [t.ivOutstanding, summary.outstandingGross],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-2xl panel p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className="mt-1 font-display text-lg font-semibold tabular-nums text-gray-900 dark:text-white">{kr(value)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl panel">
        <div className="overflow-x-auto">
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
                    <Link href={`/accountant/clients/${companyId}/invoices/${r.id}`} className="text-nordic-600 hover:underline">
                      {r.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-900 dark:text-white">{r.buyerName}</td>
                  <td className={td}>{r.issueDate.slice(0, 10)}</td>
                  <td className={td}>{r.dueDate ? r.dueDate.slice(0, 10) : "-"}</td>
                  <td className={`${td} text-right tabular-nums`}>{kr(r.total)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        r.status === "paid"
                          ? "rounded-full bg-green-100/50 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-300"
                          : "rounded-full bg-amber-100/50 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                      }
                    >
                      {r.status === "paid" ? t.ivPaid : t.ivUnpaid}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
