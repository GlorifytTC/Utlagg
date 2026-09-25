"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { LogoUploader } from "@/components/dashboard/LogoUploader";

const card = "rounded-2xl border border-gray-900/[0.07] bg-white/60 p-6 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]";
const label = "mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500";
const input = "w-full rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white";

/** The accountant's personal details: profile picture and name. Email is read-only. */
export function AccountantSettings({ name: initialName, email, logoUrl }: { name: string; email: string; logoUrl: string | null }) {
  const { lang } = useLanguage();
  const at = accountantStrings(lang);
  const { update } = useSession();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  async function saveLogo(dataUrl: string | null) {
    const res = await fetch("/api/accountant/logo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoUrl: dataUrl }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? at.error);
      throw new Error();
    }
    window.dispatchEvent(new CustomEvent("accountant-logo-updated", { detail: dataUrl }));
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
      await update({ name });
      toast.success(at.settingsSaved);
    } catch {
      toast.error(at.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{at.settingsTitle}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{at.settingsSubtitle}</p>
      </div>

      <section className={card}>
        <p className={label}>{at.menuProfilePic}</p>
        <LogoUploader value={logoUrl} label={at.menuProfilePic} onSave={saveLogo} />
      </section>

      <form onSubmit={saveName} className={`${card} space-y-4`}>
        <div>
          <label htmlFor="acct-name" className={label}>{at.settingsName}</label>
          <input id="acct-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} autoComplete="name" className={input} />
        </div>
        <div>
          <label htmlFor="acct-email" className={label}>{at.settingsEmail}</label>
          <input id="acct-email" value={email} readOnly className={`${input} cursor-not-allowed text-gray-500 dark:text-gray-400`} />
        </div>
        <button
          type="submit"
          disabled={saving || !name.trim() || name.trim() === initialName}
          className="rounded-full bg-nordic-600 px-5 py-2 text-sm font-medium text-white transition-[background-color,transform] hover:bg-nordic-700 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? at.settingsSaving : at.settingsSave}
        </button>
      </form>
    </div>
  );
}
