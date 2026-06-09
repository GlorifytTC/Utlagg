// components/landing/Footer.tsx
"use client";

import { useLanguage } from "@/context/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-col gap-8 border-t hairline pt-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-2xl">{t.footerTitle}</p>
          <p className="mt-2 max-w-sm text-sm text-ink/60">
            {t.footerDescription}
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-ink/70">
          <span className="rounded-full border hairline px-3 py-1">
            {t.footerGDPR}
          </span>
          <span className="rounded-full border hairline px-3 py-1">
            {t.footerAudit}
          </span>
          <span className="rounded-full border hairline px-3 py-1">
            {t.footerBankID}
          </span>
        </div>
      </div>
      <p className="mt-8 text-xs text-ink/40">
        {t.footerCopyright.replace("{year}", String(currentYear))}
        <br />
        {t.footerDisclaimer}
      </p>
    </footer>
  );
}