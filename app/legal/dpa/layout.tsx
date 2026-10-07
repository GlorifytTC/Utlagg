import type { Metadata } from "next";

// Static (sv) like the sibling legal layouts; the page body itself is bilingual.
export const metadata: Metadata = {
  title: "Personuppgiftsbiträdesavtal - Kvittino",
  alternates: { canonical: "/legal/dpa" },
};

export default function DpaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
