"use client";

import { useState, useMemo, useRef, useEffect, useId } from "react";
import { searchBasAccounts } from "@/lib/bas";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";

export function BasSelect({
  value,
  onChange,
  id,
}: {
  value: string | null;
  onChange: (code: string) => void;
  /** Id for the combobox input so an external <Label htmlFor> can label it. */
  id?: string;
}) {
  const { t } = useLanguage();
  const uid = useId();
  const listId = `${uid}-list`;
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

  const showList = open && results.length > 0;

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
      <Input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList ? `${uid}-opt-${focusedIndex}` : undefined}
        autoComplete="off"
        value={open ? query : value ?? ""}
        placeholder={t.basSearchPlaceholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />

      {showList && (
        <div className="panel absolute z-20 mt-1 w-full overflow-hidden rounded-xl dark:border-white/[0.07] dark:bg-[#0A0A0A]">
          <ul id={listId} role="listbox" className="max-h-64 overflow-auto py-1">
            {results.map((a, index) => (
              <li
                key={a.code}
                id={`${uid}-opt-${index}`}
                role="option"
                aria-selected={index === focusedIndex}
                onClick={() => {
                  onChange(a.code);
                  setOpen(false);
                  setQuery("");
                }}
                onMouseEnter={() => setFocusedIndex(index)}
                className={cn(
                  "flex min-h-11 w-full cursor-pointer items-center gap-3 px-3 py-2 text-left text-sm transition-colors md:min-h-0",
                  index === focusedIndex ? "bg-gray-900/[0.04] dark:bg-white/[0.04]" : "hover:bg-gray-900/[0.04] dark:hover:bg-white/[0.04]",
                )}
              >
                <span className="font-mono text-sm text-nordic-600">{a.code}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{a.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
