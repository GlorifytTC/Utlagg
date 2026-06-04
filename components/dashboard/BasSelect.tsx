"use client";

import { useState, useMemo } from "react";
import { searchBasAccounts } from "@/lib/bas";

export function BasSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (code: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchBasAccounts(query).slice(0, 8), [query]);

  return (
    <div className="relative">
      <input
        value={open ? query : value ?? ""}
        placeholder="Sök BAS-konto (t.ex. 5800 eller resekostnader)"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-lg border hairline bg-white px-3 py-2.5 text-sm outline-none focus:border-nordic-600"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border hairline bg-white shadow-lg">
          {results.map((a) => (
            <li key={a.code}>
              <button
                type="button"
                onMouseDown={() => {
                  onChange(a.code);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-nordic-50"
              >
                <span className="font-mono text-nordic-600">{a.code}</span>
                <span className="text-ink/80">{a.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
