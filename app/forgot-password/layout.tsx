import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Glömt lösenord",
  description:
    "Återställ ditt lösenord till Kvittino.",
  robots: { index: false },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
