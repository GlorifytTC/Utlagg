"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/context/LanguageContext";
import { PageHeader } from "@/components/dashboard/PageHeader";

interface Company { id: string; name: string; orgNumber?: string; vatNumber?: string; }
interface Member { id: string; userId: string; role: string; email: string | null; name: string | null; }

export default function CompanyPage() {
  const { t } = useLanguage();
  const [company, setCompany] = useState<Company | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", orgNumber: "", vatNumber: "" });
  const [invite, setInvite] = useState({ email: "", role: "member" });

  const load = useCallback(async () => {
    const r = await fetch("/api/company");
    const d = await r.json();
    setCompany(d.company);
    setRole(d.role);
    if (d.company) {
      const m = await fetch("/api/company/members");
      if (m.ok) setMembers((await m.json()).members);
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const canManage = role === "owner" || role === "admin";

  async function createCompany() {
    if (!form.name) { toast.error(t.toastEnterCompanyName); return; }
    const r = await fetch("/api/company", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    if (r.ok) { toast.success(t.toastCompanyCreated); load(); }
    else { const e = await r.json().catch(() => ({})); toast.error(e.error ?? t.toastCreateFail); }
  }

  async function sendInvite() {
    if (!invite.email) { toast.error(t.toastEnterEmail); return; }
    const r = await fetch("/api/company/invite", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(invite),
    });
    if (r.ok) { toast.success(t.toastInviteSent); setInvite({ email: "", role: "member" }); }
    else { const e = await r.json().catch(() => ({})); toast.error(e.error ?? t.toastInviteFail); }
  }

  async function changeRole(memberId: string, newRole: string) {
    const r = await fetch("/api/company/members", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, role: newRole }),
    });
    if (r.ok) { toast.success(t.toastRoleUpdated); load(); } else toast.error(t.toastUpdateFail);
  }

  async function removeMember(memberId: string) {
    if (!confirm(t.confirmRemoveMember)) return;
    const r = await fetch(`/api/company/members?memberId=${memberId}`, { method: "DELETE" });
    if (r.ok) { toast.success(t.toastRemoved); load(); }
    else { const e = await r.json().catch(() => ({})); toast.error(e.error ?? t.toastRemoveFail); }
  }

  if (loading) return <p className="text-sm text-gray-500">{t.loading}</p>;

  if (!company) {
    return (
      <div className="max-w-xl space-y-6">
        <PageHeader title={t.navCompany} description={t.pdCompany} />
        <Card>
          <CardHeader>
            <CardTitle>{t.btnCreateCompany}</CardTitle>
            <CardDescription>{t.coCreateDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>{t.fldCompanyName}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t.fldOrgNumber}</Label>
              <Input value={form.orgNumber} onChange={(e) => setForm({ ...form, orgNumber: e.target.value })} placeholder="556677-8899" /></div>
            <div className="space-y-2"><Label>{t.fldVatNumber}</Label>
              <Input value={form.vatNumber} onChange={(e) => setForm({ ...form, vatNumber: e.target.value })} placeholder="SE556677889901" /></div>
            <Button onClick={createCompany}>{t.btnCreateCompany}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={company.name} description={t.pdCompany} />

      <Card>
        <CardHeader><CardTitle>{t.coMembers}</CardTitle><CardDescription>{t.coYourRole} {role}</CardDescription></CardHeader>
        <CardContent>
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.07]">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">{m.name ?? m.email}</p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {canManage && m.role !== "owner" ? (
                    <select value={m.role} onChange={(e) => changeRole(m.id, e.target.value)}
                      className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-white/[0.10] dark:bg-[#111]">
                      <option value="member">{t.roleMember}</option>
                      <option value="admin">{t.roleAdmin}</option>
                    </select>
                  ) : (<span className="text-sm text-gray-500">{m.role}</span>)}
                  {canManage && m.role !== "owner" && (
                    <button onClick={() => removeMember(m.id)} className="text-sm text-red-600 hover:underline">{t.btnDelete}</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {canManage && (
        <Card>
          <CardHeader><CardTitle>{t.btnInviteColleague}</CardTitle><CardDescription>{t.coInviteDesc}</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap items-end gap-2">
            <div className="space-y-2"><Label>{t.fldEmail}</Label>
              <Input type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="kollega@foretag.se" /></div>
            <div className="space-y-2"><Label>{t.fldRole}</Label>
              <select value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}
                className="flex h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-white/[0.10] dark:bg-[#111]">
                <option value="member">{t.roleMember}</option>
                <option value="admin">{t.roleAdmin}</option>
              </select></div>
            <Button onClick={sendInvite}>{t.btnSendInvite}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
