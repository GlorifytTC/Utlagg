import Link from "next/link";
import { desc, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { formatDate } from "@/lib/utils";
import { Button, buttonClass } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Admin · Företag" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

// Internal admin tool: Swedish-only by design, strings are inline (no i18n).
export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const q = searchParams.q?.trim();
  const page = Math.max(1, Number(searchParams.page ?? "1"));
  const where = q ? or(ilike(companies.name, `%${q}%`), ilike(companies.orgNumber, `%${q}%`)) : undefined;

  const rows = (await db
    .select({
      id: companies.id,
      name: companies.name,
      orgNumber: companies.orgNumber,
      createdAt: companies.createdAt,
      owner: sql<string | null>`(SELECT u.email FROM company_members m JOIN users u ON u.id = m.user_id
        WHERE m.company_id = ${companies.id} AND m.role = 'owner' LIMIT 1)`,
      members: sql<number>`(SELECT count(*)::int FROM company_members m WHERE m.company_id = ${companies.id})`,
    })
    .from(companies)
    .where(where)
    .orderBy(desc(companies.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE)) as Array<{
    id: string;
    name: string;
    orgNumber: string | null;
    createdAt: Date;
    owner: string | null;
    members: number;
  }>;

  const [{ total }] = (await db
    .select({ total: sql<number>`count(*)::int` })
    .from(companies)
    .where(where)) as { total: number }[];

  const pages = Math.max(1, Math.ceil(Number(total) / PAGE_SIZE));
  const pageHref = (p: number) => `/admin/companies?page=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div className="space-y-6">
      <PageHeader title={`Företag (${Number(total)})`} />

      <form method="GET" className="flex flex-wrap gap-2">
        <Input
          name="q"
          type="search"
          aria-label="Sök företag"
          defaultValue={q ?? ""}
          placeholder="Sök namn eller org.nummer…"
          className="sm:!w-72"
        />
        <Button type="submit" variant="outline">Sök</Button>
      </form>

      <div className="panel overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead className="text-left text-xs font-medium text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Företag</th>
              <th className="px-4 py-3">Org.nummer</th>
              <th className="px-4 py-3">Ägare</th>
              <th className="px-4 py-3">Medlemmar</th>
              <th className="px-4 py-3">Skapad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-gray-900/[0.03] dark:hover:bg-white/[0.04]">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/companies/${c.id}`}
                    className="text-nordic-600 underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 tabular-nums">{c.orgNumber ?? "-"}</td>
                <td className="break-all px-4 py-3">{c.owner ?? "-"}</td>
                <td className="px-4 py-3 tabular-nums">{Number(c.members)}</td>
                <td className="px-4 py-3">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">Inga företag</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 text-sm">
        {page > 1 && <Link className={buttonClass("outline")} href={pageHref(page - 1)}>← Föregående</Link>}
        <span className="text-gray-500 dark:text-gray-400">Sida {page} av {pages}</span>
        {page < pages && <Link className={buttonClass("outline")} href={pageHref(page + 1)}>Nästa →</Link>}
      </div>
    </div>
  );
}
