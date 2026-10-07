import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gå med i företag",
  description:
    "Slutför din inbjudan och gå med i företaget i Kvittino.",
  robots: { index: false },
};

export default function CompanyJoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
