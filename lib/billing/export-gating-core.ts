/**
 * Pure export-gating decision (spec §C) — no I/O, no `server-only`, no db, so
 * the legal guardrail can be unit-tested in isolation
 * (tests/unit/export-gating.test.ts).
 *
 * ⚠️ CRITICAL GUARDRAIL: in read-only / lapsed / expired-trial state a COMPLETE
 * CSV export and ORIGINAL-FILE download MUST remain available — the user may
 * hold the only copy of records they must keep for 7 years (Bokföringslagen).
 * This function NEVER blocks a format in ALWAYS_AVAILABLE_EXPORTS, regardless of
 * state. Only the convenience/premium formats in GATED_EXPORT_FORMATS are gated,
 * and only in read-only state.
 */
import {
  ALWAYS_AVAILABLE_EXPORTS,
  GATED_EXPORT_FORMATS,
  type ExportFormat,
} from "@/lib/billing/config";
import type { AccessState } from "@/lib/billing/access";

export type ExportDenyReason = "gated_read_only";

export interface ExportDecision {
  allowed: boolean;
  format: ExportFormat;
  reason: "ok" | ExportDenyReason;
  /** User-facing explanation (never a silent failure — spec §C.3). */
  message?: string;
  /** Always-available fallbacks to surface alongside a denial (spec §C.3). */
  fallback?: { csvUrl: string; filesHint: string };
}

/** Where a blocked user is pointed for their always-available records. */
export const CSV_FALLBACK_URL = "/api/export/csv";
export const FILES_FALLBACK_HINT = "/dashboard/receipts";

const GATED_MSG =
  "Detta exportformat kräver en aktiv prenumeration. Aktivera en plan för att " +
  "exportera i SIE/SIE4 eller till bokföringsprogram. Din fullständiga " +
  "CSV-export och dina originalfiler är fortfarande tillgängliga.";

export function canUseExport(
  account: { state: AccessState },
  format: ExportFormat,
): ExportDecision {
  // Invariant #1: the always-available formats are NEVER blocked, full stop.
  if (ALWAYS_AVAILABLE_EXPORTS.includes(format)) {
    return { allowed: true, format, reason: "ok" };
  }

  // Active subscription or active trial → all formats.
  if (account.state !== "read_only") {
    return { allowed: true, format, reason: "ok" };
  }

  // Read-only: only the gated formats are blocked; anything not explicitly
  // gated stays open (fail-open toward availability — spec §C).
  if (GATED_EXPORT_FORMATS.includes(format)) {
    return {
      allowed: false,
      format,
      reason: "gated_read_only",
      message: GATED_MSG,
      fallback: { csvUrl: CSV_FALLBACK_URL, filesHint: FILES_FALLBACK_HINT },
    };
  }
  return { allowed: true, format, reason: "ok" };
}
