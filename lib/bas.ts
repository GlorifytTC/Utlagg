/**
 * Swedish BAS chart of accounts — a working SUBSET of the most common expense
 * accounts (cost classes 4xxx–6xxx + a few input-VAT accounts). The full
 * BAS-kontoplan contains several hundred accounts; extend this list as needed
 * or import the official CSV from https://www.bas.se/ for completeness.
 *
 * Each entry maps a BAS account to a default VAT category so the dashboard can
 * suggest a rate when a user picks an account.
 */
import type { VatCategory } from "./vat";

export interface BasAccount {
  code: string;
  name: string; // Swedish name
  vatCategory: VatCategory;
}

export const BAS_ACCOUNTS: BasAccount[] = [
  { code: "4000", name: "Inköp av varor", vatCategory: "standard" },
  { code: "5010", name: "Lokalhyra", vatCategory: "standard" },
  { code: "5020", name: "El för belysning", vatCategory: "standard" },
  { code: "5410", name: "Förbrukningsinventarier", vatCategory: "standard" },
  { code: "5460", name: "Förbrukningsmaterial", vatCategory: "standard" },
  { code: "5611", name: "Drivmedel personbilar", vatCategory: "standard" },
  { code: "5615", name: "Leasing av personbilar", vatCategory: "standard" },
  { code: "5800", name: "Resekostnader", vatCategory: "transport" },
  { code: "5810", name: "Biljetter (tåg/buss/flyg)", vatCategory: "transport" },
  { code: "5831", name: "Kost och logi i Sverige", vatCategory: "hotel" },
  { code: "5832", name: "Kost och logi i utlandet", vatCategory: "standard" },
  { code: "5910", name: "Annonsering", vatCategory: "standard" },
  { code: "6071", name: "Representation, avdragsgill", vatCategory: "restaurant_dinein" },
  { code: "6072", name: "Representation, ej avdragsgill", vatCategory: "restaurant_dinein" },
  { code: "6110", name: "Kontorsmateriel", vatCategory: "standard" },
  { code: "6212", name: "Mobiltelefon", vatCategory: "standard" },
  { code: "6230", name: "Datakommunikation", vatCategory: "standard" },
  { code: "6250", name: "Porto", vatCategory: "standard" },
  { code: "6420", name: "Revisionsarvoden", vatCategory: "standard" },
  { code: "6540", name: "IT-tjänster", vatCategory: "standard" },
  { code: "6550", name: "Förbrukningsinventarier (IT)", vatCategory: "standard" },
  { code: "6560", name: "Programvaror / SaaS", vatCategory: "standard" },
  { code: "6970", name: "Tidningar, facklitteratur", vatCategory: "books_news" },
  { code: "6990", name: "Övriga externa kostnader", vatCategory: "standard" },
  { code: "7610", name: "Utbildning", vatCategory: "standard" },
  { code: "7631", name: "Personalrepresentation", vatCategory: "restaurant_dinein" },
];

export function searchBasAccounts(query: string): BasAccount[] {
  const q = query.trim().toLowerCase();
  if (!q) return BAS_ACCOUNTS;
  return BAS_ACCOUNTS.filter(
    (a) => a.code.includes(q) || a.name.toLowerCase().includes(q),
  );
}

export function getBasAccount(code: string): BasAccount | undefined {
  return BAS_ACCOUNTS.find((a) => a.code === code);
}
