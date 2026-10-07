import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Funktioner",
  description:
    "AI-skanning av kvitton, automatisk momsbokföring (6/12/25 %), BAS-konton, export till SIE och Fortnox samt revisorsportal. Se allt Kvittino kan.",
  alternates: { canonical: "/features" },
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
