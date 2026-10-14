import { getServerLang } from "@/lib/i18n-server";

export function generateMetadata() {
  const sv = getServerLang() === "sv";
  return {
    title: sv ? "Acceptera revisorsinbjudan" : "Accept accountant invitation",
    description: sv
      ? "Godkänn en redovisningskonsults inbjudan att få åtkomst till ditt företags kvitton i Kvittino."
      : "Approve an accountant's invitation to access your company's receipts in Kvittino.",
    robots: { index: false },
  };
}

export default function AccountantAcceptLayout({ children }: { children: React.ReactNode }) {
  return children;
}
