// components/landing/Footer.tsx
"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  const cols = [
    {
      title: t.footerProduct,
      links: [
        { href: "/features", label: t.features },
        { href: "/pricing", label: t.pricing },
      ],
    },
    {
      title: t.footerCompany,
      links: [
        { href: "/about", label: t.about },
        { href: "/contact", label: t.contact },
      ],
    },
    {
      title: t.footerLegal,
      links: [
        { href: "/legal/terms", label: t.footerTerms },
        { href: "/legal/privacy", label: t.footerPrivacy },
      ],
    },
  ];

  return (
    <footer className="border-t hairline bg-grain">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-2xl">{t.footerTitle}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink/60">
              {t.footerDescription}
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-ink/70">
              <span className="rounded-full border hairline px-3 py-1">{t.footerGDPR}</span>
              <span className="rounded-full border hairline px-3 py-1">{t.footerAudit}</span>
              <span className="rounded-full border hairline px-3 py-1">{t.footerBankID}</span>
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-ink/40">{c.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-ink/70 transition hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t hairline pt-6 text-xs text-ink/40">
          <p>{t.footerCopyright.replace("{year}", String(year))}</p>
          <p className="mt-1">{t.footerDisclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
