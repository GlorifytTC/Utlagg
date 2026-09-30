"use client";

import { useState } from "react";
import { Select } from "@/components/ui/input";
import { buttonClass } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

const MONTHS = [
  "Januari", "Februari", "Mars", "April", "Maj", "Juni",
  "Juli", "Augusti", "September", "Oktober", "November", "December",
];

function lastDay(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Month/year range picker that downloads a Skatteverket-format CSV.
 * endpoint defaults to the user export; admin passes the admin endpoint.
 */
export function SkatteverketExport({
  endpoint = "/api/export/skatteverket",
}: {
  endpoint?: string;
}) {
  const { t } = useLanguage();
  const now = new Date();
  const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - i);

  const [fromYear, setFromYear] = useState(now.getFullYear());
  const [fromMonth, setFromMonth] = useState(0);
  const [toYear, setToYear] = useState(now.getFullYear());
  const [toMonth, setToMonth] = useState(now.getMonth());

  function download() {
    const from = `${fromYear}-${String(fromMonth + 1).padStart(2, "0")}-01`;
    const to = `${toYear}-${String(toMonth + 1).padStart(2, "0")}-${String(
      lastDay(toYear, toMonth),
    ).padStart(2, "0")}`;
    window.location.href = `${endpoint}?from=${from}&to=${to}`;
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-2">
        <div>
          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{t.receiptFrom}</p>
          <div className="flex gap-2">
            <Select value={fromMonth} onChange={(e) => setFromMonth(Number(e.target.value))} className="!w-auto">
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </Select>
            <Select value={fromYear} onChange={(e) => setFromYear(Number(e.target.value))} className="!w-auto">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{t.receiptTo}</p>
          <div className="flex gap-2">
            <Select value={toMonth} onChange={(e) => setToMonth(Number(e.target.value))} className="!w-auto">
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </Select>
            <Select value={toYear} onChange={(e) => setToYear(Number(e.target.value))} className="!w-auto">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>
        </div>
        <button onClick={download} className={buttonClass("default", "w-full sm:w-auto")}>
          Ladda ner CSV
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Svenskt format: SEK med kommatecken, semikolon-avgränsat, UTF-8 (öppnas i Excel).
        Kolumner: datum, leverantör, belopp, moms, momssats, BAS-konto, kategori, beskrivning, bildreferens.
      </p>
    </div>
  );
}
