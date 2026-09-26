import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "För redovisningsbyråer",
  description:
    "Alla klienters kvitton i en att-göra-lista. Kvittino flaggar kvitton som saknar moms eller BAS, osäkra AI-avläsningar och ej attesterade utlägg. SIE-export per klient, chatt och team. Gratis för byråer.",
  alternates: { canonical: "/for-accountants" },
  openGraph: {
    title: "Kvittino för redovisningsbyråer — gratis byråkonto",
    description:
      "Granska, rätta och exportera alla klienters kvitton från en arbetsyta. Gratis för byråer.",
    type: "website",
  },
};

export default function ForAccountantsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
