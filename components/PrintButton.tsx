"use client";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

export function PrintButton() {
  const { t } = useLanguage();
  return (
    <Button variant="outline" onClick={() => window.print()} className="print:hidden">
      {t.printSavePdf}
    </Button>
  );
}
