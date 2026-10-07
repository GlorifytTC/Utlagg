import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceptera uppdrag",
  description:
    "Acceptera en inbjudan som redovisningskonsult i Kvittino.",
  robots: { index: false },
};

export default function AccountantAcceptLayout({ children }: { children: React.ReactNode }) {
  return children;
}
