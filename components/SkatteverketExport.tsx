"use client";

import { useState } from "react";

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

  const sel =
    "rounded-lg border border-gray-300 px-2 py-2 text-sm dark:border-white/[0.10] dark:bg-[#111]";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <p className="mb-1 text-xs text-gray-500">Från</p>
          <div className="flex gap-2">
            <select value={fromMonth} onChange={(e) => setFromMonth(Number(e.target.value))} className={sel}>
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={fromYear} onChange={(e) => setFromYear(Number(e.target.value))} className={sel}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs text-gray-500">Till</p>
          <div className="flex gap-2">
            <select value={toMonth} onChange={(e) => setToMonth(Number(e.target.value))} className={sel}>
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={toYear} onChange={(e) => setToYear(Number(e.target.value))} className={sel}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={download}
          className="rounded-lg bg-nordic-600 px-4 py-2 text-sm font-medium text-white hover:bg-nordic-900"
        >
          Ladda ner CSV
        </button>
      </div>
      <p className="text-xs text-gray-400">
        Svenskt format: SEK med kommatecken, semikolon-avgränsat, UTF-8 (öppnas i Excel).
        Kolumner: datum, leverantör, belopp, moms, momssats, BAS-konto, kategori, beskrivning, bildreferens.
      </p>
    </div>
  );
}
