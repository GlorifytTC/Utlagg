import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nytt lösenord",
  description:
    "Välj ett nytt lösenord för ditt Kvittino-konto.",
  robots: { index: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
