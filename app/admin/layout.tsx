import { redirect } from "next/navigation";
import Link from "next/link";
import { adminGate } from "@/lib/admin";

export const dynamic = "force-dynamic";

const nav = [
  { name: "Översikt", href: "/admin" },
  { name: "Användare", href: "/admin/users" },
  { name: "Intäkter", href: "/admin/revenue" },
  { name: "Systemhälsa", href: "/admin/health" },
  { name: "Efterlevnad", href: "/admin/compliance" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const gate = await adminGate();
  if (gate.state === "anon") redirect("/login");
  if (gate.state === "forbidden") redirect("/dashboard");
  const session = gate.session;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <aside className="fixed left-0 top-0 flex h-full w-60 flex-col border-r border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="px-2 py-4">
          <p className="font-display text-lg font-semibold">Kvittino Admin</p>
          <p className="truncate text-xs text-gray-500">{session.user?.email}</p>
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {n.name}
            </Link>
          ))}
        </nav>
        <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          ← Till appen
        </Link>
      </aside>
      <main className="ml-60 p-8">{children}</main>
    </div>
  );
}
