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

/**
 * Reads the language the SERVER used to render this page. The server picks
 * it from the `utlagg_lang` cookie (see lib/i18n-server.ts), so the client's
 * very first client render must MATCH what the server rendered. These are
 * client components SSR'd to static HTML with no per-user cookie applied at
 * that point, so the server always emits the default ("sv"). Therefore the
 * client's first render must ALSO be "sv" — reading the cookie during the
 * initial render (which differs server vs client) is exactly what caused
 * the #418/#423/#425 hydration mismatches. We read the stored/cookie
 * language in useEffect instead, i.e. AFTER hydration, when a change no
 * longer causes a mismatch.
 */
function storedLang(): Lang {
  try {
    const m = document.cookie.match(/(?:^|;\s*)utlagg_lang=(sv|en)\b/);
    if (m) return m[1] as Lang;
    const ls = window.localStorage.getItem(STORAGE_KEY);
    if (ls === "sv" || ls === "en") return ls;
  } catch {
    /* ignore */
  }
  return "sv";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // ALWAYS "sv" on the first render (server and client alike) so the
  // hydrated HTML matches exactly. The real preference is applied in the
  // effect below, after hydration.
  const [lang, setLang] = useState<Lang>("sv");

  useEffect(() => {
    const preferred = storedLang();
    if (preferred !== "sv") setLang(preferred);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
