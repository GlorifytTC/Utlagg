import { describe, it, expect } from "vitest";
import { canUseExport } from "@/lib/billing/export-gating-core";
import {
  ALWAYS_AVAILABLE_EXPORTS,
  GATED_EXPORT_FORMATS,
  type ExportFormat,
} from "@/lib/billing/config";

describe("canUseExport — active / trial get every format", () => {
  it.each(["active", "trial"] as const)("%s → all formats allowed", (state) => {
    for (const fmt of [
      "csv",
      "original_files",
      "sie",
      "sie4",
      "pdf",
      "premium_pdf",
      "integration_fortnox",
    ] as ExportFormat[]) {
      expect(canUseExport({ state }, fmt).allowed).toBe(true);
    }
  });
});

describe("canUseExport — read-only gating (spec §C)", () => {
  it("blocks gated premium formats with an explicit message + fallbacks", () => {
    for (const fmt of GATED_EXPORT_FORMATS) {
      const d = canUseExport({ state: "read_only" }, fmt);
      expect(d.allowed).toBe(false);
      expect(d.reason).toBe("gated_read_only");
      expect(d.message).toBeTruthy(); // never a silent failure (§C.3)
      expect(d.fallback?.csvUrl).toBeTruthy(); // surface the CSV fallback
    }
  });

  it("blocks SIE4 specifically (the intended hook — §13.5)", () => {
    expect(canUseExport({ state: "read_only" }, "sie4").allowed).toBe(false);
  });

  // ── The legal invariant: CSV + original files are NEVER blocked. ──
  it("NEVER blocks CSV or original-file download in read-only", () => {
    expect(canUseExport({ state: "read_only" }, "csv").allowed).toBe(true);
    expect(canUseExport({ state: "read_only" }, "original_files").allowed).toBe(true);
  });

  it("every always-available format stays allowed in read-only", () => {
    for (const fmt of ALWAYS_AVAILABLE_EXPORTS) {
      expect(canUseExport({ state: "read_only" }, fmt).allowed).toBe(true);
    }
  });

  it("config guardrail: no always-available format is also gated", () => {
    for (const fmt of ALWAYS_AVAILABLE_EXPORTS) {
      expect(GATED_EXPORT_FORMATS).not.toContain(fmt);
    }
  });
});
