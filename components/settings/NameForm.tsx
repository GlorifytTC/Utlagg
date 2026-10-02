"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/context/LanguageContext";

/** Display name + read-only email. `onSaved` lets a role react (accountant rename resets verification). */
export function NameForm({ onSaved }: { onSaved?: () => void }) {
  const { t } = useLanguage();
  const { data: session, update } = useSession();
  // Session can still be loading on first render; show it once it arrives unless the user has typed.
  const [typed, setName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const current = session?.user?.name ?? "";
  const name = typed ?? current;

  async function save(e: React.FormEvent) {
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
      <form onSubmit={save}>
        <CardHeader>
          <CardTitle>{t.prNameTitle}</CardTitle>
          <CardDescription>{t.prNameDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </form>
    </Card>
  );
}
