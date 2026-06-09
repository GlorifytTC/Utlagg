// context/LanguageContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { strings, Translations, Lang } from "@/lib/translations";

interface LanguageContextType {
  lang: Lang;
  toggleLanguage: () => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("sv");
  const toggleLanguage = () => setLang((prev) => (prev === "sv" ? "en" : "sv"));
  const t = strings[lang];

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}