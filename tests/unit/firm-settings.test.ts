import { describe, it, expect, vi, beforeEach } from "vitest";

const set = vi.fn();
const requireFirmRole = vi.fn();

vi.mock("@/db", () => ({ db: { update: () => ({ set: (v: unknown) => { set(v); return { where: async () => {} }; } }) } }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), clientIp: () => null }));
vi.mock("@/lib/accountant", async () => {
  const actual = await vi.importActual<typeof import("@/lib/accountant")>("@/lib/accountant");
  return { ...actual, requireFirmRole: (min: string) => requireFirmRole(min) };
});
vi.mock("server-only", () => ({}));

const { PATCH } = await import("@/app/api/accountant/firm/route");
const { firmRoleAtLeast, validateLogo } = await import("@/lib/accountant");

const req = (body: unknown) =>
  new Request("http://x/api/accountant/firm", { method: "PATCH", body: JSON.stringify(body) }) as never;
const admin = { userId: "u", email: null, firmId: "f", role: "admin" };

describe("firm name + logo — owner/admin only", () => {
  beforeEach(() => { set.mockClear(); requireFirmRole.mockReset(); });

  it("admin threshold: member denied, admin and owner allowed", () => {
    expect(firmRoleAtLeast("member", "admin")).toBe(false);
    expect(firmRoleAtLeast("admin", "admin")).toBe(true);
    expect(firmRoleAtLeast("owner", "admin")).toBe(true);
  });

  it("route asks for admin and returns 403 without writing when the gate fails", async () => {
    requireFirmRole.mockResolvedValue(null);
    const res = await PATCH(req({ name: "Ny byrå" }));
    expect(requireFirmRole).toHaveBeenCalledWith("admin");
    expect(res.status).toBe(403);
    expect(set).not.toHaveBeenCalled();
  });

  it("rename writes only the trimmed name; blank or empty body rejected", async () => {
    requireFirmRole.mockResolvedValue(admin);
    expect((await PATCH(req({ name: "  Ny byrå  " }))).status).toBe(200);
    expect(set).toHaveBeenLastCalledWith({ name: "Ny byrå" });
    expect((await PATCH(req({ name: "   " }))).status).toBe(400);
    expect((await PATCH(req({}))).status).toBe(400);
    expect(set).toHaveBeenCalledTimes(1);
  });

  it("logo writes only the logo; non-image payload rejected", async () => {
    requireFirmRole.mockResolvedValue(admin);
    expect((await PATCH(req({ logoUrl: "data:image/png;base64,AAAA" }))).status).toBe(200);
    expect(set).toHaveBeenLastCalledWith({ logoUrl: "data:image/png;base64,AAAA" });
    expect((await PATCH(req({ logoUrl: null }))).status).toBe(200);
    expect(set).toHaveBeenLastCalledWith({ logoUrl: null });
    expect((await PATCH(req({ logoUrl: "javascript:alert(1)" }))).status).toBe(400);
    expect(validateLogo("data:text/html;base64,AAAA").ok).toBe(false);
  });
});
