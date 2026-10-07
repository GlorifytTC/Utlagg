"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CompanyLogoCard } from "@/components/dashboard/CompanyLogoCard";
import { useLanguage } from "@/context/LanguageContext";
import type { SellerDetails } from "@/lib/invoice";
import { SectionHeader } from "@/components/settings/SettingsShell";

interface Company {
  id: string; name: string; orgNumber?: string; vatNumber?: string;
  address?: string | null; postalCode?: string | null; city?: string | null;
  invoiceDetails?: SellerDetails | null;
}
type DetailsForm = { address: string; postalCode: string; city: string } & Omit<Required<SellerDetails>, "fSkatt"> & { fSkatt: boolean };
interface Member { id: string; userId: string; role: string; email: string | null; name: string | null; }

export default function CompanyPage() {
  const { t } = useLanguage();
  const [company, setCompany] = useState<Company | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", orgNumber: "", vatNumber: "" });
  const [details, setDetails] = useState<DetailsForm | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [invite, setInvite] = useState({ firstName: "", lastName: "", email: "", role: "member" });

  const load = useCallback(async () => {
    const r = await fetch("/api/company");
    const d = await r.json();
    setCompany(d.company);
    setRole(d.role);
    if (d.company) {
      const c: Company = d.company;
      const inv = c.invoiceDetails ?? {};
      setDetails({
        address: c.address ?? "", postalCode: c.postalCode ?? "", city: c.city ?? "",
        bankgiro: inv.bankgiro ?? "", plusgiro: inv.plusgiro ?? "", iban: inv.iban ?? "", bic: inv.bic ?? "",
        fSkatt: inv.fSkatt ?? false, email: inv.email ?? "", phone: inv.phone ?? "", website: inv.website ?? "",
      });
      const m = await fetch("/api/company/members");
      if (m.ok) {
        const mj = await m.json();
        setMembers(mj.members ?? []);
        setMyUserId(mj.myUserId ?? null);
      } else {
        setMembers([]);
        setMyUserId(null);
      }
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const canManage = role === "owner" || role === "admin";
  const roleLabel = (r: string | null) =>
    r === "owner" ? t.roleOwner : r === "admin" ? t.roleAdmin : r === "member" ? t.roleMember : r === "approver" ? t.roleApprover : (r ?? "");

  async function createCompany() {
    if (!form.name) { toast.error(t.toastEnterCompanyName); return; }
    if (!form.orgNumber) { toast.error(t.toastEnterOrgNumber); return; }
    const r = await fetch("/api/company", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    if (r.ok) { toast.success(t.toastCompanyCreated); load(); }
    else { const e = await r.json().catch(() => ({})); toast.error(e.error ?? t.toastCreateFail); }
  }

  async function saveDetails() {
    if (!details) return;
    const { address, postalCode, city, ...invoiceDetails } = details;
    const r = await fetch("/api/company", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, postalCode, city, invoiceDetails }),
    });
    if (r.ok) toast.success(t.coDetailsSaved); else toast.error(t.toastUpdateFail);
  }

  async function sendInvite() {
    if (!invite.email) { toast.error(t.toastEnterEmail); return; }
    if (!invite.firstName.trim() || !invite.lastName.trim()) { toast.error(t.toastEnterName); return; }
    const r = await fetch("/api/company/invite", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(invite),
    });
    if (r.ok) { toast.success(t.toastInviteSent); setInvite({ firstName: "", lastName: "", email: "", role: "member" }); }
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
    setRemoveId(null);
    const r = await fetch(`/api/company/members?memberId=${memberId}`, { method: "DELETE" });
    if (r.ok) { toast.success(t.toastRemoved); load(); }
    else { const e = await r.json().catch(() => ({})); toast.error(e.error ?? t.toastRemoveFail); }
  }

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label={t.loading}>
        <div className="skeleton h-9 w-56 rounded-xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <SectionHeader title={t.navCompany} />
        <Card>
          <CardHeader>
            <CardTitle as="h2">{t.btnCreateCompany}</CardTitle>
            <CardDescription>{t.coCreateDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="cc-fldCompanyName">{t.fldCompanyName}</Label>
              <Input id="cc-fldCompanyName" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="cc-fldOrgNumber">{t.fldOrgNumber}</Label>
              <Input id="cc-fldOrgNumber" value={form.orgNumber} onChange={(e) => setForm({ ...form, orgNumber: e.target.value })} placeholder="556677-8899" /></div>
            <div className="space-y-2"><Label htmlFor="cc-fldVatNumber">{t.fldVatNumber}</Label>
              <Input id="cc-fldVatNumber" value={form.vatNumber} onChange={(e) => setForm({ ...form, vatNumber: e.target.value })} placeholder="SE556677889901" /></div>
            <Button onClick={createCompany}>{t.btnCreateCompany}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CompanyLogoCard name={company.name} isOwner={role === "owner"} />

      {canManage && (
      <Card>
        <CardHeader><CardTitle as="h2">{t.coMembers}</CardTitle><CardDescription>{t.coYourRole} {roleLabel(role)}</CardDescription></CardHeader>
        <CardContent>
          <ul className="divide-y divide-gray-900/[0.06] dark:divide-white/[0.07]">
            {members.map((m) => {
              const isSelf = m.userId === myUserId;
              // Only the owner may change roles; never on the owner row or self.
              const canChangeRole = role === "owner" && m.role !== "owner" && !isSelf;
              // Owner/admin may remove others, but never the owner or themselves.
              const canRemove = canManage && m.role !== "owner" && !isSelf;
              return (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0 break-words">
                  <p className="font-medium">{m.name ?? m.email}{isSelf && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({t.coYou})</span>}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {canChangeRole ? (
                    <Select value={m.role} onChange={(e) => changeRole(m.id, e.target.value)} aria-label={t.fldRole}
                      className="!h-11 !w-auto md:!h-10">
                      <option value="member">{t.roleMember}</option>
                      <option value="admin">{t.roleAdmin}</option>
                    </Select>
                  ) : (<span className="text-sm text-gray-500 dark:text-gray-400">{roleLabel(m.role)}</span>)}
                  {canRemove && (
                    <Button variant="ghost" onClick={() => setRemoveId(m.id)} className="text-red-600 hover:bg-red-50/70 dark:text-red-400 dark:hover:bg-red-950/25">{t.btnDelete}</Button>
                  )}
                </div>
              </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
      )}

      {canManage && details && (
        <Card>
          <CardHeader><CardTitle as="h2">{t.coInvoiceDetailsTitle}</CardTitle><CardDescription>{t.coInvoiceDetailsDesc}</CardDescription></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="cd-fldAddress">{t.fldAddress}</Label>
              <Input id="cd-fldAddress" value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} placeholder="Storgatan 1" /></div>
            <div className="space-y-2"><Label htmlFor="cd-fldPostalCode">{t.fldPostalCode}</Label>
              <Input id="cd-fldPostalCode" value={details.postalCode} onChange={(e) => setDetails({ ...details, postalCode: e.target.value })} placeholder="123 45" /></div>
            <div className="space-y-2"><Label htmlFor="cd-fldCity">{t.fldCity}</Label>
              <Input id="cd-fldCity" value={details.city} onChange={(e) => setDetails({ ...details, city: e.target.value })} placeholder="Stockholm" /></div>
            <div className="space-y-2"><Label htmlFor="cd-invBankgiro">{t.invBankgiro}</Label>
              <Input id="cd-invBankgiro" value={details.bankgiro} onChange={(e) => setDetails({ ...details, bankgiro: e.target.value })} placeholder="123-4567" /></div>
            <div className="space-y-2"><Label htmlFor="cd-invPlusgiro">{t.invPlusgiro}</Label>
              <Input id="cd-invPlusgiro" value={details.plusgiro} onChange={(e) => setDetails({ ...details, plusgiro: e.target.value })} placeholder="12 34 56-7" /></div>
            <div className="space-y-2"><Label htmlFor="cd-invIban">{t.invIban}</Label>
              <Input id="cd-invIban" value={details.iban} onChange={(e) => setDetails({ ...details, iban: e.target.value })} placeholder="SE45 5000 0000 0583 9825 7466" /></div>
            <div className="space-y-2"><Label htmlFor="cd-invBic">{t.invBic}</Label>
              <Input id="cd-invBic" value={details.bic} onChange={(e) => setDetails({ ...details, bic: e.target.value })} placeholder="ESSESESS" /></div>
            <div className="space-y-2"><Label htmlFor="cd-fldEmail">{t.fldEmail}</Label>
              <Input id="cd-fldEmail" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} placeholder="faktura@foretag.se" /></div>
            <div className="space-y-2"><Label htmlFor="cd-fldPhone">{t.fldPhone}</Label>
              <Input id="cd-fldPhone" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} placeholder="08-123 456 78" /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="cd-fldWebsite">{t.fldWebsite}</Label>
              <Input id="cd-fldWebsite" value={details.website} onChange={(e) => setDetails({ ...details, website: e.target.value })} placeholder="foretag.se" /></div>
            <Checkbox
              labelClassName="sm:col-span-2"
              checked={details.fSkatt}
              onChange={(e) => setDetails({ ...details, fSkatt: e.target.checked })}
              label={t.invFSkatt}
            />
            <div className="sm:col-span-2"><Button onClick={saveDetails}>{t.btnSave}</Button></div>
          </CardContent>
        </Card>
      )}

      {canManage && (
        <Card>
          <CardHeader><CardTitle as="h2">{t.btnInviteColleague}</CardTitle><CardDescription>{t.coInviteDesc}</CardDescription></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="ci-fldFirstName">{t.fldFirstName}</Label>
              <Input id="ci-fldFirstName" value={invite.firstName} onChange={(e) => setInvite({ ...invite, firstName: e.target.value })} placeholder={t.fldFirstName} /></div>
            <div className="space-y-2"><Label htmlFor="ci-fldLastName">{t.fldLastName}</Label>
              <Input id="ci-fldLastName" value={invite.lastName} onChange={(e) => setInvite({ ...invite, lastName: e.target.value })} placeholder={t.fldLastName} /></div>
            <div className="space-y-2"><Label htmlFor="ci-fldEmail">{t.fldEmail}</Label>
              <Input id="ci-fldEmail" type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="kollega@foretag.se" /></div>
            <div className="space-y-2"><Label htmlFor="ci-fldRole">{t.fldRole}</Label>
              <Select id="ci-fldRole" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
                <option value="member">{t.roleMember}</option>
                <option value="admin">{t.roleAdmin}</option>
              </Select></div>
            <Button onClick={sendInvite} className="sm:col-span-2 sm:w-fit">{t.btnSendInvite}</Button>
          </CardContent>
        </Card>
      )}
      <ConfirmDialog
        open={removeId !== null}
        title={t.confirmRemoveMember}
        confirmLabel={t.btnDelete}
        cancelLabel={t.btnCancel}
        destructive
        onConfirm={() => removeId && removeMember(removeId)}
        onCancel={() => setRemoveId(null)}
      />
    </div>
  );
}
