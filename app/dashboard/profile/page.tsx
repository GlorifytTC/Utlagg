"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/context/LanguageContext";

export default function ProfilePage() {
  const { t } = useLanguage();
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(session?.user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function updateName() {
    setLoading(true);
    const res = await fetch("/api/user/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      await update({ name });
      toast.success(t.toastNameUpdated);
    } else {
      toast.error(t.toastNameUpdateFail);
    }
    setLoading(false);
  }

  async function changePassword() {
    if (newPassword !== confirmPassword) {
      toast.error(t.toastPwMismatch);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) {
      toast.success(t.toastPwChanged);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error(e.message ?? t.toastPwChangeFail);
    }
    setLoading(false);
  }

  async function deleteAccount() {
    setLoading(true);
    const res = await fetch("/api/user/delete", { method: "DELETE" });
    if (res.ok) {
      toast.success(t.toastAccountDeleted);
      await signOut({ callbackUrl: "/" });
    } else {
      toast.error(t.toastAccountDeleteFail);
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.prTitle}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t.prNameTitle}</CardTitle>
          <CardDescription>{t.prNameDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.fldName}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.prEmailLabel} {session?.user?.email ?? "—"}
          </p>
          <Button onClick={updateName} disabled={loading}>
            {t.btnSaveChanges}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.prChangePw}</CardTitle>
          <CardDescription>{t.prPwDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current">{t.fldCurrentPw}</Label>
            <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new">{t.fldNewPw}</Label>
            <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">{t.fldConfirmPw}</Label>
            <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <Button onClick={changePassword} disabled={loading}>
            {t.btnChangePw}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900/50">
        <CardHeader>
          <CardTitle className="text-red-600">{t.btnDeleteAccount}</CardTitle>
          <CardDescription>
            {t.prDeleteDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            {t.btnDeleteAccountPermanent}
          </Button>
        </CardContent>
      </Card>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t.prSureTitle}</CardTitle>
              <CardDescription>
                {t.prSureDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={loading}>
                {t.btnCancel}
              </Button>
              <Button variant="destructive" onClick={deleteAccount} disabled={loading}>
                {t.prConfirmDelete}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
