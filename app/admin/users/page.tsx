import Link from "next/link";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { formatDate } from "@/lib/utils";
import { Button, buttonClass } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Admin · Användare" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; tier?: string; page?: string };
}) {
  const q = searchParams.q?.trim();
  const tier = searchParams.tier?.trim();
  const page = Math.max(1, Number(searchParams.page ?? "1"));

  const conds = [];
  if (q) conds.push(ilike(users.email, `%${q}%`));
  if (tier && tier !== "all") conds.push(eq(users.subscriptionTier, tier as never));
  const where = conds.length ? and(...conds) : undefined;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      tier: users.subscriptionTier,
      status: users.subscriptionStatus,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const [{ total }] = (await db
    .select({ total: sql<number>`count(*)::int` })
    .from(users)
    .where(where)) as { total: number }[];

  const pages = Math.max(1, Math.ceil(Number(total) / PAGE_SIZE));
  const csvHref = `/api/admin/users?format=csv${q ? `&q=${encodeURIComponent(q)}` : ""}${tier ? `&tier=${encodeURIComponent(tier)}` : ""}`;
  const pageHref = (p: number) =>
    `/admin/users?page=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}${tier ? `&tier=${encodeURIComponent(tier)}` : ""}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Användare (${Number(total)})`}
        actions={<a href={csvHref} className={buttonClass("outline")}>Exportera CSV</a>}
      />

      <form method="GET" className="flex flex-wrap gap-2">
        <Input
          name="q"
          type="search"
          aria-label="Sök e-post"
          defaultValue={q ?? ""}
          placeholder="Sök e-post…"
          className="sm:!w-64"
        />
        <Select name="tier" aria-label="Plan" defaultValue={tier ?? "all"} className="sm:!w-48">
          <option value="all">Alla planer</option>
          <option value="free">Gratis</option>
          <option value="pro">Pro</option>
          <option value="business">Företag</option>
          <option value="enterprise">Enterprise</option>
        </Select>
        <Button type="submit" variant="outline">Filtrera</Button>
      </form>

      <div className="panel overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead className="text-left text-xs font-medium text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">E-post</th>
              <th className="px-4 py-3">Namn</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Skapad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((u: Record<string, unknown>) => (
              <tr key={u.id as string} className="hover:bg-gray-900/[0.03] dark:hover:bg-white/[0.04]">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.id}`} className="break-all text-nordic-600 underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
                    {u.email as string}
                  </Link>
                </td>
                <td className="px-4 py-3">{(u.name as string) ?? "-"}</td>
                <td className="px-4 py-3">{u.tier as string}</td>
                <td className="px-4 py-3">{u.status as string}</td>
                <td className="px-4 py-3">{formatDate(u.createdAt as Date)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">Inga användare</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 text-sm">
        {page > 1 && (
          <Link className={buttonClass("outline")} href={pageHref(page - 1)}>← Föregående</Link>
        )}
        <span className="text-gray-500 dark:text-gray-400">Sida {page} av {pages}</span>
        {page < pages && (
          <Link className={buttonClass("outline")} href={pageHref(page + 1)}>Nästa →</Link>
        )}
      </div>
    </div>
  );
}
