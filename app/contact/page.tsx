"use client";

import { useState } from "react";
import { Mail, Briefcase, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { AmbientBackground } from "@/components/landing/AmbientBackground";
import { ChatBox } from "@/components/ChatBox";

const SUPPORT_EMAIL = "hej@utlagg.se";
const SALES_EMAIL = "sales@utlagg.se";

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
    <div className="relative">
      <AmbientBackground />
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 pt-16 md:pt-24">
        <p className="font-sans text-sm uppercase tracking-[0.2em] text-nordic-600">
          {t.contactKicker}
        </p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">
          {t.contactTitle}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">{t.contactLead}</p>

        <div className="mt-16 grid gap-12 pb-24 md:grid-cols-[1fr_1.2fr] md:gap-16">
          {/* Contact info */}
          <div className="space-y-8">
            {info.map((c) => {
              const Icon = c.icon;
              const inner = (
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border hairline text-nordic-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-sans text-xs uppercase tracking-[0.16em] text-ink/40">
                      {c.label}
                    </p>
                    <p className="mt-1 font-display text-xl text-ink">{c.value}</p>
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

          {/* Form */}
          <div className="rounded-3xl border hairline bg-grain p-8">
            <h2 className="font-display text-2xl">{t.contactFormTitle}</h2>
            <p className="mt-2 text-sm text-ink/60">{t.contactFormDesc}</p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-ink/70">{t.contactName}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-sm outline-none transition focus:border-nordic-600"
                />
              </div>
              <div>
                <label className="text-sm text-ink/70">{t.contactEmailField}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-sm outline-none transition focus:border-nordic-600"
                />
              </div>
              <div>
                <label className="text-sm text-ink/70">{t.contactMessage}</label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.contactMessagePh}
                  className="mt-1.5 w-full resize-none rounded-xl border border-ink/15 bg-paper px-4 py-3 text-sm outline-none transition focus:border-nordic-600"
                />
              </div>
              <button
                onClick={send}
                disabled={!name || !email || !message}
                className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-paper transition hover:bg-nordic-900 disabled:opacity-40"
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
