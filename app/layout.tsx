import type { Metadata, Viewport } from "next";
import { Fraunces, Schibsted_Grotesk } from "next/font/google";
import { Providers } from "@/components/Providers";
import { CookieConsent } from "@/components/CookieConsent";
// @ts-ignore: CSS side-effect import without type declarations
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
    default: "Utlagg — AI-driven expense management för svenska företag",
    template: "%s · Utlagg",
  },
  description:
    "Skanna kvitton med AI, bokför moms (6/12/25 %) automatiskt och exportera till Skatteverket. GDPR-säker kvittohantering och expense management i Sverige.",
  keywords: [
    "utlagg",
    "expense management Sverige",
    "kvittohantering",
    "AI scanning",
    "utläggshantering",
    "bokföring moms",
    "BAS-konto",
  ],
  openGraph: {
    title: "Utlagg — AI-driven expense management",
    description:
      "Skanna, bokför och exportera kvitton automatiskt. Byggd för svenska moms- och bokföringsregler.",
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Utlagg — AI-driven kvittohantering",
    description: "Smart kvittoscanning med AI för svenska företag.",
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
        <CookieConsent />
      </body>
    </html>
  );
}