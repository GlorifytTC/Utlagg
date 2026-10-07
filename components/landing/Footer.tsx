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
        { href: "/for-accountants", label: t.forFirms },
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
        { href: "/legal/dpa", label: t.footerDpa },
        { href: "/legal/subprocessors", label: t.spTitle },
        { href: "/security", label: t.footerSecurity },
      ],
    },
  ];

  return (
    <footer className="border-t hairline">
      <div className="mx-auto max-w-6xl px-6 pb-12 pt-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <p className="font-display text-2xl font-semibold tracking-tight">{t.footerTitle}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink/65">
              {t.footerDescription}
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-ink/70">
              <span className="rounded-full bg-ink/[0.04] px-3 py-1.5">{t.footerGDPR}</span>
              <span className="rounded-full bg-ink/[0.04] px-3 py-1.5">{t.footerAudit}</span>
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-sm font-semibold text-ink">{c.title}</p>
              <ul className="mt-4 space-y-0.5 text-sm md:space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-block rounded py-2 text-ink/65 transition duration-300 ease-premium hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t hairline pt-6 text-xs text-ink/65">
          <p>{t.footerCopyright.replace("{year}", String(year))}</p>
        </div>
      </div>
    </footer>
  );
}
