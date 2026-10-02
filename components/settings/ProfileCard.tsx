"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoUploader } from "@/components/dashboard/LogoUploader";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Profile picture + display name in one card, for both roles. `logoEndpoint`
 * is the role's own GET/PATCH `{ logoUrl }` route; `onSaved` lets the
 * accountant refresh verification after a rename.
 */
export function ProfileCard({ logoEndpoint, onSaved }: { logoEndpoint: string; onSaved?: () => void }) {
  const { t } = useLanguage();
  const { data: session, update } = useSession();
  // Session can still be loading on first render; show it once it arrives unless the user has typed.
  const [typed, setName] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const current = session?.user?.name ?? "";
  const name = typed ?? current;

  useEffect(() => {
    fetch(logoEndpoint)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLogo(d?.logoUrl ?? null))
      .catch(() => setLogo(null));
  }, [logoEndpoint]);

  async function saveLogo(logoUrl: string | null) {
    const res = await fetch(logoEndpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoUrl }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? t.logoSaveError);
      throw new Error();
    }
    // The accountant sidebar/header avatars listen for this.
    window.dispatchEvent(new CustomEvent("accountant-logo-updated", { detail: logoUrl }));
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/user/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      await update({ name });
      toast.success(t.toastNameUpdated);
      onSaved?.();
    } else {
      toast.error(t.toastNameUpdateFail);
    }
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.setProfile}</CardTitle>
        <CardDescription>{t.prNameDesc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {logo !== undefined ? (
          <LogoUploader value={logo} label={t.setProfilePicture} onSave={saveLogo} />
        ) : (
          <div className="skeleton h-16 w-16 rounded-lg" aria-hidden />
        )}
        <form onSubmit={saveName} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.fldName}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} autoComplete="name" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.prEmailLabel} {session?.user?.email ?? "-"}
          </p>
          <Button type="submit" disabled={saving || !name.trim() || name.trim() === current}>
            {t.btnSaveChanges}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
