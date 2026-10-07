import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceptera inbjudan",
  description:
    "Acceptera inbjudan till ett företag i Kvittino.",
  robots: { index: false },
};

export default function AcceptInviteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
