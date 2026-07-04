import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Om oss",
  description:
    "Kvittino är byggt i Sverige för svenska regler — svensk moms (6/12/25 %), BAS-konton, BankID och 7-årigt arkiv enligt Bokföringslagen. Lär känna teamet bakom AI-driven kvittohantering.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Om Kvittino — byggt i Sverige för svenska regler",
    description:
      "AI-driven kvittohantering med svensk moms, BAS-konton och Skatteverket inbyggt från start.",
    type: "website",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
