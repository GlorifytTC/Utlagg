import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gå med i byrå",
  description:
    "Slutför din inbjudan och gå med i byrån i Kvittino.",
  robots: { index: false },
};

export default function FirmJoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
