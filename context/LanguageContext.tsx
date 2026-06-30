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
 * very first render MUST start from that same cookie — otherwise a user who
 * chose English gets server HTML in English but a client first-render in
 * Swedish, which is a hydration mismatch (React #418/#423) on every
 * translated string. The cookie is readable synchronously, so unlike
 * localStorage it's safe to use for the initial state.
 */
function initialLangFromCookie(): Lang {
  if (typeof document === "undefined") return "sv"; // server: matches getServerLang default
  const m = document.cookie.match(/(?:^|;\s*)utlagg_lang=(sv|en)\b/);
  return m ? (m[1] as Lang) : "sv";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialise from the cookie so server and client agree on the first
  // render. (On the server `document` is undefined and we return "sv",
  // exactly matching getServerLang()'s default for a cookieless request.)
  const [lang, setLang] = useState<Lang>(initialLangFromCookie);

  useEffect(() => {
    // localStorage is the legacy store; reconcile it with the cookie in case
    // they ever diverge, and migrate it forward. Cookie is the source of
    // truth since the server can read it.
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
      const cookieLang = initialLangFromCookie();
      if (cookieLang !== lang) {
        setLang(cookieLang);
      } else if ((stored === "sv" || stored === "en") && stored !== lang) {
        setLang(stored);
      }
    } catch {
      /* ignore */
    }
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
