"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings, type AccountantStrings } from "@/lib/accountant-i18n";
import { CREDENTIAL_ACCEPT, MAX_CREDENTIAL_BYTES } from "@/lib/verification";
import { LogoUploader } from "@/components/dashboard/LogoUploader";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Button, buttonClass } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";

const card = "rounded-2xl panel p-6";
const label = "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";
const input = `${fieldClass} h-10 py-2`;

type VerificationStatus = "pending" | "approved" | "rejected" | null;

/** The accountant's personal details: profile picture, name and credential verification. Email is read-only. */
export function AccountantSettings({
  name: initialName,
  email,
  logoUrl,
  verificationStatus,
  verificationNote,
}: {
  name: string;
  email: string;
  logoUrl: string | null;
  verificationStatus: VerificationStatus;
  verificationNote: string | null;
}) {
  const { lang } = useLanguage();
  const at = accountantStrings(lang);
  const router = useRouter();
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
      // A rename sends an approved verification back to review.
      router.refresh();
    } catch {
      toast.error(at.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={at.settingsTitle} subtitle={at.settingsSubtitle} />

      <section className={card}>
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">{at.menuProfilePic}</h2>
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
        <Button type="submit" disabled={saving || !name.trim() || name.trim() === initialName}>
          {saving ? at.settingsSaving : at.settingsSave}
        </Button>
      </form>

      <VerificationCard at={at} status={verificationStatus} note={verificationNote} onSubmitted={() => router.refresh()} />
    </div>
  );
}

function VerificationCard({
  at,
  status,
  note,
  onSubmitted,
}: {
  at: AccountantStrings;
  status: VerificationStatus;
  note: string | null;
  onSubmitted: () => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_CREDENTIAL_BYTES) {
      toast.error(at.verifyTooLarge);
      return;
    }
    setUploading(true);
    try {
      const document = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/accountant/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error ?? at.error);
        return;
      }
      toast.success(at.verifySubmitted);
      onSubmitted();
    } catch {
      toast.error(at.error);
    } finally {
      setUploading(false);
    }
  }

  const statusText =
    status === "approved" ? at.verifyApproved
      : status === "pending" ? at.verifyPending
      : status === "rejected" ? at.verifyRejected
      : at.verifyNone;

  return (
    <section className={`${card} space-y-3`}>
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{at.verifyTitle}</h2>
        {status === "approved" && <VerifiedBadge />}
      </div>
      {status !== "approved" && <p className="text-sm text-gray-600 dark:text-gray-300">{at.verifyIntro}</p>}
      <p className="text-sm font-medium text-gray-900 dark:text-white" role="status">{statusText}</p>
      {status === "rejected" && note && (
        <p className="rounded-xl bg-gray-900/[0.03] p-3 text-sm text-gray-700 dark:bg-white/[0.04] dark:text-gray-300">
          {at.verifyNote}: {note}
        </p>
      )}
      {status !== "approved" && (
        <div>
          <label className={buttonClass("default", "w-full cursor-pointer sm:w-auto focus-within:ring-4 focus-within:ring-nordic-600/20")}>
            {uploading ? at.verifyUploading : status ? at.verifyReplace : at.verifyUpload}
            <input type="file" accept={CREDENTIAL_ACCEPT} onChange={upload} disabled={uploading} className="sr-only" />
          </label>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{at.verifyHint}</p>
        </div>
      )}
    </section>
  );
}
