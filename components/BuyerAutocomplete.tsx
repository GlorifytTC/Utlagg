"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";

export interface Buyer {
  name: string;
  orgNumber?: string | null;
  vatNumber?: string | null;
  address?: string | null;
}

interface Props {
  onSelect: (buyer: Buyer) => void;
  onInputChange?: (value: string) => void;
  /** Lets a <Label htmlFor> point at the text field. */
  id?: string;
}

export function BuyerAutocomplete({ onSelect, onInputChange, id }: Props) {
  const { t } = useLanguage();
  const uid = useId();
  const listId = `${uid}-buyers`;
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Buyer[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [fetchedOnce, setFetchedOnce] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchBuyers = useCallback(async (q: string) => {
    const res = await fetch(`/api/buyers?q=${encodeURIComponent(q)}`);
    if (!res.ok) return;
    const data = await res.json();
    setSuggestions(data.buyers ?? []);
    setHighlightIndex(-1);
    setFetchedOnce(true);
  }, []);

  // debounced fetch on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchBuyers(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchBuyers]);

  // close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectItem = useCallback(
    (buyer: Buyer) => {
      setQuery(buyer.name);
      setOpen(false);
      onSelect(buyer);
    },
    [onSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0) selectItem(suggestions[highlightIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleFocus = async () => {
    // fetch all buyers on first focus if query is empty
    if (!fetchedOnce) {
      await fetchBuyers("");
    }
    setOpen(true);
  };

  return (
    <div ref={ref} className="relative">
      <Input
        id={id}
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onInputChange?.(e.target.value);
          setOpen(true);
        }}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={t.fldCompanyName}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listId}
        aria-activedescendant={open && highlightIndex >= 0 ? `${uid}-opt-${highlightIndex}` : undefined}
      />
      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="panel absolute z-50 mt-1 max-h-[40dvh] w-full overflow-auto rounded-xl py-1 dark:border-white/[0.07] dark:bg-[#0A0A0A]"
        >
          {suggestions.map((buyer, idx) => (
            <li
              key={`${buyer.name}-${buyer.orgNumber ?? ""}`}
              id={`${uid}-opt-${idx}`}
              role="option"
              aria-selected={idx === highlightIndex}
              className={`cursor-pointer px-3 py-3 text-sm md:py-2 ${
                idx === highlightIndex
                  ? "bg-gray-100 dark:bg-white/[0.08]"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectItem(buyer);
              }}
              onMouseEnter={() => setHighlightIndex(idx)}
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {buyer.name}
              </span>
              {buyer.orgNumber && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  {buyer.orgNumber}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}