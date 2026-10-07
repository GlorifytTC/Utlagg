import { redirect } from "next/navigation";
import { adminGate } from "@/lib/admin";
import { AdminChrome } from "@/components/admin/AdminChrome";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const gate = await adminGate();
  if (gate.state === "anon") redirect("/login");
  if (gate.state === "forbidden") redirect("/dashboard");

  return <AdminChrome email={gate.session.user?.email}>{children}</AdminChrome>;
}
