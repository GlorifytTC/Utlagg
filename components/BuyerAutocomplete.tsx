"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";

interface Buyer {
  name: string;
  orgNumber?: string | null;
  vatNumber?: string | null;
  address?: string | null;
}

interface Props {
  onSelect: (buyer: Buyer) => void;
  onInputChange?: (value: string) => void;
}

export function BuyerAutocomplete({ onSelect, onInputChange }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Buyer[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const res = await fetch(`/api/buyers?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.buyers);
        setOpen(true);
        setHighlightIndex(-1);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

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
      if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
        selectItem(suggestions[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={ref} className="relative">
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onInputChange?.(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Företagsnamn"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
        aria-controls="buyer-listbox"
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
      />
      {open && suggestions.length > 0 && (
        <ul
          id="buyer-listbox"
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg"
        >
          {suggestions.map((buyer, idx) => (
            <li
              key={`${buyer.name}-${buyer.orgNumber ?? ""}`}
              role="option"
              aria-selected={idx === highlightIndex}
              className={`cursor-pointer px-3 py-2 text-sm ${
                idx === highlightIndex ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectItem(buyer);
              }}
              onMouseEnter={() => setHighlightIndex(idx)}
            >
              <span className="font-medium">{buyer.name}</span>
              {buyer.orgNumber && (
                <span className="ml-2 text-xs text-gray-500">
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