import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontakta Utlagg om AI-driven kvittohantering, priser eller din bokföring. Vi svarar normalt inom en arbetsdag.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Kontakta Utlagg",
    description: "Frågor om produkten, priser eller din bokföring? Hör av dig.",
    type: "website",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
