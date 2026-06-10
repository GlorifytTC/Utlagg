// context/LanguageContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { strings, Translations, Lang } from "@/lib/translations";

interface LanguageContextType {
  lang: Lang;
  setLanguage: (lang: Lang) => void;
  toggleLanguage: () => void;
  t: Translations;
}

const STORAGE_KEY = "utlagg_lang";
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Start with "sv" on both server and first client render to avoid a hydration
  // mismatch, then adopt the stored choice on mount.
  const [lang, setLang] = useState<Lang>("sv");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored === "sv" || stored === "en") setLang(stored);
    } catch {
      /* ignore */
    }
  }, []);

  function setLanguage(next: Lang) {
    setLang(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      // Also a cookie, so SERVER components (the dashboard pages) can read it.
      document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      /* ignore */
    }
  }

  const toggleLanguage = () => setLanguage(lang === "sv" ? "en" : "sv");
  const t = strings[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
