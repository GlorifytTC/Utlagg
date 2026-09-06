import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import { CookieConsent } from "@/components/CookieConsent";
// @ts-ignore: CSS side-effect import without type declarations
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: {
    default: "Kvittino — AI-driven expense management för svenska företag",
    template: "%s · Kvittino",
  },
  description:
    "Skanna kvitton med AI, bokför moms (6/12/25 %) automatiskt och exportera till Skatteverket. GDPR-säker kvittohantering och expense management i Sverige.",
  keywords: [
    "kvittino",
    "expense management Sverige",
    "kvittohantering",
    "AI scanning",
    "utläggshantering",
    "bokföring moms",
    "BAS-konto",
  ],
  openGraph: {
    title: "Kvittino — AI-driven expense management",
    description:
      "Skanna, bokför och exportera kvitton automatiskt. Byggd för svenska moms- och bokföringsregler.",
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kvittino — AI-driven kvittohantering",
    description: "Smart kvittoscanning med AI för svenska företag.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/kvittino-mark.svg", type: "image/svg+xml" }],
    apple: [{ url: "/kvittino-mark.svg" }],
  },
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
    <html lang="sv" className={jakarta.variable}>
      <body className="bg-paper text-ink font-sans antialiased">
        <Providers>
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}