"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

export function DeleteAccountCard() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy]);

  async function remove() {
    setBusy(true);
    const res = await fetch("/api/user/delete", { method: "DELETE" });
    if (res.ok) {
      toast.success(t.toastAccountDeleted);
      await signOut({ callbackUrl: "/" });
    } else {
      toast.error(t.toastAccountDeleteFail);
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <>
      <Card className="border-red-200 dark:border-red-900/50">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">{t.btnDeleteAccount}</CardTitle>
          <CardDescription>{t.prDeleteDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setOpen(true)}>{t.btnDeleteAccountPermanent}</Button>
        </CardContent>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card role="dialog" aria-modal="true" aria-labelledby="delete-title" className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto">
            <CardHeader>
              <CardTitle id="delete-title">{t.prSureTitle}</CardTitle>
              <CardDescription>{t.prSureDesc}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button className="w-full sm:w-auto" variant="outline" autoFocus onClick={() => setOpen(false)} disabled={busy}>{t.btnCancel}</Button>
              <Button className="w-full sm:w-auto" variant="destructive" onClick={remove} disabled={busy}>{t.prConfirmDelete}</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
