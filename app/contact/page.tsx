"use client";

import { useState } from "react";
import { Mail, Briefcase, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { AmbientBackground } from "@/components/landing/AmbientBackground";
import { ChatBox } from "@/components/ChatBox";

const SUPPORT_EMAIL = "hej@kvittino.se";
const SALES_EMAIL = "sales@kvittino.se";

function ContactContent() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function send() {
    const subject = encodeURIComponent(t.contactSubject);
    const body = encodeURIComponent(
      `${t.contactName}: ${name}\n${t.contactEmailField}: ${email}\n\n${message}`,
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }

  const info = [
    { icon: Mail, label: t.contactEmailLabel, value: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
    { icon: Briefcase, label: t.contactSalesLabel, value: SALES_EMAIL, href: `mailto:${SALES_EMAIL}` },
    { icon: Clock, label: t.contactResponseLabel, value: t.contactResponseValue, href: null },
  ];

  return (
    <div className="light-surface relative overflow-x-clip">
      <AmbientBackground />
      <Navbar />
      <main className="mx-auto grid max-w-6xl items-start gap-12 px-6 pb-24 pt-12 md:grid-cols-[1fr_1.15fr] md:gap-20 md:pb-32 md:pt-20">
        <div>
          <p className="text-sm font-medium text-nordic-600">{t.contactKicker}</p>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            {t.contactTitle}
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink/65">{t.contactLead}</p>

          {/* Contact info */}
          <div className="mt-12 space-y-8">
            {info.map((c) => {
              const Icon = c.icon;
              const inner = (
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink/[0.04] text-nordic-600 ring-1 ring-ink/5">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="text-sm text-ink/55">
                      {c.label}
                    </p>
                    <p className="mt-0.5 font-display text-xl font-semibold tracking-tight text-ink">{c.value}</p>
                  </div>
                </div>
              );
              return c.href ? (
                <a key={c.label} href={c.href} className="block transition hover:opacity-70">
                  {inner}
                </a>
              ) : (
                <div key={c.label}>{inner}</div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <div className="bezel">
          <div className="bezel-core p-8 md:p-10">
            <h2 className="font-display text-2xl font-semibold tracking-tight">{t.contactFormTitle}</h2>
            <p className="mt-2 text-sm text-ink/60">{t.contactFormDesc}</p>
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="contact-name" className="text-sm font-medium text-ink/75">{t.contactName}</label>
                <input
                  id="contact-name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm outline-none transition placeholder:text-ink/45 focus:border-nordic-600 focus-visible:ring-4 focus-visible:ring-nordic-600/15"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="text-sm font-medium text-ink/75">{t.contactEmailField}</label>
                <input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm outline-none transition placeholder:text-ink/45 focus:border-nordic-600 focus-visible:ring-4 focus-visible:ring-nordic-600/15"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="text-sm font-medium text-ink/75">{t.contactMessage}</label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.contactMessagePh}
                  className="mt-1.5 w-full resize-none rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm outline-none transition placeholder:text-ink/45 focus:border-nordic-600 focus-visible:ring-4 focus-visible:ring-nordic-600/15"
                />
              </div>
              <button
                type="button"
                onClick={send}
                disabled={!name || !email || !message}
                className="w-full rounded-full bg-nordic-600 px-6 py-3.5 text-sm font-medium text-white transition duration-500 ease-premium hover:bg-nordic-700 active:scale-[0.98] disabled:opacity-40"
              >
                {t.contactSend}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ChatBox />
    </div>
  );
}

export default function ContactPage() {
  return <ContactContent />;
}
