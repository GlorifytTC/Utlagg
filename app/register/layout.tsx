import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skapa konto",
  description:
    "Skapa ett Kvittino-konto och börja skanna kvitton med AI.",
  robots: { index: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
