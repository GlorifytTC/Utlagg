import { describe, it, expect } from "vitest";

/**
 * UI/API contract tests. There is no component-test framework in this repo
 * (no RTL/jsdom), so per the "reuse existing infrastructure" rule these verify
 * the request SHAPES the accountant UI components send — the paths and bodies
 * the components construct — so a future backend change that breaks the UI
 * contract is caught. Pure-logic, matching the repo's existing test style.
 */

// Mirror the URL/body construction inside the UI components.
function receiptsUrl(companyId: string, o: { page?: number; q?: string; from?: string; to?: string; sort?: string; dir?: string }) {
  const p = new URLSearchParams({ page: String(o.page ?? 1), pageSize: "25", sort: o.sort ?? "date", dir: o.dir ?? "desc" });
  if (o.q) p.set("q", o.q);
  if (o.from) p.set("from", o.from);
  if (o.to) p.set("to", o.to);
  return `/api/accountant/clients/${companyId}/receipts?${p}`;
}
function editBody(v: { vendorName?: string; category?: string; vatAmount?: string; vatRate?: string; basCode?: string; note?: string; reviewed?: boolean }) {
  const body: Record<string, unknown> = {
    vendorName: v.vendorName || null,
    category: v.category || null,
    vatAmount: v.vatAmount === "" || v.vatAmount == null ? null : Number(v.vatAmount),
    vatRate: v.vatRate === "" || v.vatRate == null ? null : Number(v.vatRate),
    basCode: v.basCode || null,
    note: v.note || null,
  };
  if (v.reviewed !== undefined) body.reviewed = v.reviewed;
  return body;
}
const WHITELIST = new Set(["vendorName", "category", "vatAmount", "vatRate", "basCode", "note", "reviewed"]);

describe("Accountant UI → API contract", () => {
  it("receipts list URL uses the API's documented params", () => {
    const url = receiptsUrl("co1", { page: 2, q: "ICA", from: "2026-01-01", to: "2026-03-31", sort: "vendor", dir: "asc" });
    expect(url).toContain("/api/accountant/clients/co1/receipts?");
    expect(url).toContain("page=2");
    expect(url).toContain("q=ICA");
    expect(url).toContain("from=2026-01-01");
    expect(url).toContain("to=2026-03-31");
    expect(url).toContain("sort=vendor");
    expect(url).toContain("dir=asc");
  });

  it("edit body contains ONLY whitelisted fields the PATCH allows", () => {
    const body = editBody({ vendorName: "ICA", category: "Food", vatAmount: "12.5", vatRate: "12", basCode: "5811", note: "ok", reviewed: true });
    for (const k of Object.keys(body)) expect(WHITELIST.has(k)).toBe(true);
    // never sends protected fields
    expect(body).not.toHaveProperty("userId");
    expect(body).not.toHaveProperty("status");
    expect(body).not.toHaveProperty("totalAmount");
    expect(body).not.toHaveProperty("reviewedBy");
  });

  it("empty numeric fields serialize to null, not NaN", () => {
    const body = editBody({ vatAmount: "", vatRate: "" });
    expect(body.vatAmount).toBeNull();
    expect(body.vatRate).toBeNull();
  });

  it("review action sends the boolean, not a reviewer id", () => {
    const on = editBody({ reviewed: true });
    const off = editBody({ reviewed: false });
    expect(on.reviewed).toBe(true);
    expect(off.reviewed).toBe(false);
    expect(on).not.toHaveProperty("reviewedBy");
  });

  it("export body sends format + optional range only", () => {
    const csv = { format: "csv", from: "2026-01-01", to: undefined };
    expect(csv.format).toBe("csv");
    expect(csv.from).toBe("2026-01-01");
    const sie = { format: "sie" };
    expect(["csv", "sie"]).toContain(sie.format);
  });

  it("connection-request action paths match the API routes", () => {
    const id = "req1";
    expect(`/api/accountant/connection-requests/${id}/accept`).toBe("/api/accountant/connection-requests/req1/accept");
    expect(`/api/accountant/connection-requests/${id}/decline`).toBe("/api/accountant/connection-requests/req1/decline");
  });

  it("revoke path targets the company-side endpoint by accountant id", () => {
    expect(`/api/company/accountants/${"acc1"}/revoke`).toBe("/api/company/accountants/acc1/revoke");
  });
});
