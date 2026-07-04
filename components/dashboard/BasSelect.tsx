"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { searchBasAccounts } from "@/lib/bas";
import { cn } from "@/lib/utils";

export function BasSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (code: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const results = useMemo(() => searchBasAccounts(query).slice(0, 8), [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setFocusedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    
    if (!open) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (results[focusedIndex]) {
          onChange(results[focusedIndex].code);
          setOpen(false);
          setQuery("");
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        ref={inputRef}
        value={open ? query : value ?? ""}
        placeholder="Sök BAS-konto (t.ex. 5800 eller resekostnader)"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className="w-full rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white dark:placeholder:text-gray-600"
      />
      
      {/* Dropdown */}
      <div
        className={cn(
          "absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-900/[0.07] bg-white/60 backdrop-blur-xl shadow-lg transition-all duration-200 dark:border-white/[0.07] dark:bg-[#0A0A0A]",
          open && results.length > 0 ? "opacity-100 translate-y-0" : "pointer-events-none -translate-y-1 opacity-0",
        )}
      >
        <ul className="max-h-64 overflow-auto py-1">
          {results.map((a, index) => (
            <li key={a.code}>
              <button
                type="button"
                onClick={() => {
                  onChange(a.code);
                  setOpen(false);
                  setQuery("");
                }}
                onMouseEnter={() => setFocusedIndex(index)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                  index === focusedIndex ? "bg-gray-900/[0.04] dark:bg-white/[0.04]" : "hover:bg-gray-900/[0.04] dark:hover:bg-white/[0.04]",
                )}
              >
                <span className="font-mono text-sm text-nordic-600">{a.code}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{a.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}