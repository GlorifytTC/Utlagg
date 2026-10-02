"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings, type AccountantStrings } from "@/lib/accountant-i18n";
import { CREDENTIAL_ACCEPT, MAX_CREDENTIAL_BYTES } from "@/lib/verification";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { buttonClass } from "@/components/ui/button";
import { SectionHeader } from "@/components/settings/SettingsShell";
import { ProfileCard } from "@/components/settings/ProfileCard";
import { PasswordCard } from "@/components/settings/PasswordCard";
import { DeleteAccountCard } from "@/components/settings/DeleteAccountCard";

const card = "rounded-2xl panel p-6";

type VerificationStatus = "pending" | "approved" | "rejected" | null;

/** The accountant's personal account: picture, name, credential verification, password, delete. Email is read-only. */
export function AccountantSettings({
  verificationStatus,
  verificationNote,
}: {
  verificationStatus: VerificationStatus;
  verificationNote: string | null;
}) {
  const { lang } = useLanguage();
  const at = accountantStrings(lang);
  const router = useRouter();

  return (
    <div className="space-y-6">
      <SectionHeader title={at.settingsAccount} />

      {/* A rename sends an approved verification back to review, so refresh the status card. */}
      <ProfileCard logoEndpoint="/api/accountant/logo" onSaved={() => router.refresh()} />

      <VerificationCard at={at} status={verificationStatus} note={verificationNote} onSubmitted={() => router.refresh()} />

      <PasswordCard />
      <DeleteAccountCard />
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
