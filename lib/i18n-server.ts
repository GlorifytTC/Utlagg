import "server-only";
import { cookies } from "next/headers";
import { strings, type Lang, type Translations } from "@/lib/translations";

/** Read the language chosen by the user (cookie set client-side), default sv. */
export function getServerLang(): Lang {
  const c = cookies().get("utlagg_lang")?.value;
  return c === "en" ? "en" : "sv";
}

/** Server-side translation bundle for the current request. */
export function getT(): Translations {
  return strings[getServerLang()];
}
