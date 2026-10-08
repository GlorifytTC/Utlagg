import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { companies, companyMembers, companyInvites, users } from "@/db/schema";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { AdminAddMember } from "@/components/admin/AdminAddMember";

export const metadata = { title: "Admin · Företag" };
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  owner: "Ägare",
  admin: "Admin",
  approver: "Attestant",
  member: "Medarbetare",
};

// Internal admin tool: Swedish-only by design. Access is gated by app/admin/layout.tsx.
export default async function AdminCompanyPage({ params }: { params: { id: string } }) {
  const [company] = await db
    .select({
      id: companies.id,
      name: companies.name,
      orgNumber: companies.orgNumber,
      city: companies.city,
      createdAt: companies.createdAt,
    })
    .from(companies)
    .where(eq(companies.id, params.id))
    .limit(1);
  if (!company) notFound();

  const members = (await db
    .select({
      id: companyMembers.id,
      userId: users.id,
      role: companyMembers.role,
      email: users.email,
      name: users.name,
      hasPassword: sql<boolean>`${users.hashedPassword} IS NOT NULL`,
      joinedAt: companyMembers.createdAt,
    })
    .from(companyMembers)
    .innerJoin(users, eq(users.id, companyMembers.userId))
    .where(eq(companyMembers.companyId, company.id))
    .orderBy(asc(companyMembers.createdAt))) as Array<{
    id: string;
    userId: string;
    role: string;
    email: string;
    name: string | null;
    hasPassword: boolean;
    joinedAt: Date;
  }>;

  const invites = (await db
    .select({
      id: companyInvites.id,
      email: companyInvites.email,
      name: companyInvites.inviteeName,
      role: companyInvites.role,
      expiresAt: companyInvites.expiresAt,
      createdAt: companyInvites.createdAt,
    })
    .from(companyInvites)
    .where(
      and(
        eq(companyInvites.companyId, company.id),
        isNull(companyInvites.acceptedAt),
        gt(companyInvites.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(companyInvites.createdAt))) as Array<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    expiresAt: Date;
    createdAt: Date;
  }>;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/admin/companies", label: "Alla företag" }}
        title={company.name}
        subtitle={[company.orgNumber, company.city, `Skapad ${formatDate(company.createdAt)}`].filter(Boolean).join(" · ")}
      />

      <section className="panel overflow-hidden rounded-2xl">
        <h2 className="p-5 pb-3 font-medium">Medlemmar ({members.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-left text-xs font-medium text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-5 py-2">Namn</th>
                <th className="px-5 py-2">E-post</th>
                <th className="px-5 py-2">Roll</th>
                <th className="px-5 py-2">Sedan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-5 py-2.5">{m.name ?? "-"}</td>
                  <td className="break-all px-5 py-2.5">
                    <Link href={`/admin/users/${m.userId}`} className="text-nordic-600 underline">{m.email}</Link>
                    {!m.hasPassword && (
                      <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                        Inget lösenord ännu
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-2.5">{ROLE_LABEL[m.role] ?? m.role}</td>
                  <td className="px-5 py-2.5 tabular-nums text-gray-500 dark:text-gray-400">{formatDate(m.joinedAt)}</td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-gray-500 dark:text-gray-400">Inga medlemmar</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {invites.length > 0 && (
        <section className="panel space-y-3 rounded-2xl p-5">
          <h2 className="font-medium">Väntande inbjudningar ({invites.length})</h2>
          <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="min-w-0 break-all">
                  {i.name ? `${i.name} · ` : ""}
                  {i.email}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {ROLE_LABEL[i.role] ?? i.role} · går ut {formatDate(i.expiresAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel space-y-4 rounded-2xl p-5">
        <div>
          <h2 className="font-medium">Lägg till admin eller medarbetare</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Lägg till en person i {company.name}. En användare kan bara tillhöra ett företag.
          </p>
        </div>
        <AdminAddMember companyId={company.id} />
      </section>
    </div>
  );
}
