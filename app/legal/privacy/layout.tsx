import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integritetspolicy — Kvittino",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
