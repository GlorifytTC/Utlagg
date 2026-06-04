import type { Metadata, Viewport } from "next";
import { Fraunces, Schibsted_Grotesk } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: {
    default: "Kvitto — AI-driven kvittohantering för svenska företag",
    template: "%s · Kvitto",
  },
  description:
    "Skanna kvitton med AI, bokför moms (6/12/25 %) automatiskt och exportera till Skatteverket. GDPR-säker kvittohantering och expense management i Sverige.",
  keywords: [
    "kvittohantering",
    "expense management Sverige",
    "AI scanning",
    "kvitto app",
    "bokföring moms",
    "utläggshantering",
    "BAS-konto",
  ],
  openGraph: {
    title: "Kvitto — AI-driven kvittohantering",
    description:
      "Skanna, bokför och exportera kvitton automatiskt. Byggd för svenska moms- och bokföringsregler.",
    locale: "sv_SE",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#16181D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" className={`${fraunces.variable} ${schibsted.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
