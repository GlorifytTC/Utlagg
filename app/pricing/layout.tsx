import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Priser",
  description:
    "Se Kvittinos priser per företag - betala för det ni använder. AI-driven kvittohantering med svensk moms och export till bokföring.",
  alternates: { canonical: "/pricing" },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
