import { describe, it, expect, vi, beforeEach } from "vitest";

const update = vi.fn();
const requireFirmRole = vi.fn();

vi.mock("@/db", () => ({ db: { update: (...a: unknown[]) => { update(...a); return { set: () => ({ where: async () => {} }) }; } } }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), clientIp: () => null }));
vi.mock("@/lib/accountant", async () => {
  const actual = await vi.importActual<typeof import("@/lib/accountant")>("@/lib/accountant");
  return { ...actual, requireFirmRole: (min: string) => requireFirmRole(min) };
});
vi.mock("server-only", () => ({}));

const { PATCH } = await import("@/app/api/accountant/firm/logo/route");
const { firmRoleAtLeast, validateLogo } = await import("@/lib/accountant");

const req = (body: unknown) =>
  new Request("http://x/api/accountant/firm/logo", { method: "PATCH", body: JSON.stringify(body) }) as never;

describe("firm logo — owner/admin only", () => {
  beforeEach(() => { update.mockClear(); requireFirmRole.mockReset(); });

  it("admin threshold: member denied, admin and owner allowed", () => {
    expect(firmRoleAtLeast("member", "admin")).toBe(false);
    expect(firmRoleAtLeast("admin", "admin")).toBe(true);
    expect(firmRoleAtLeast("owner", "admin")).toBe(true);
  });

  it("route asks for admin and returns 403 without writing when the gate fails", async () => {
    requireFirmRole.mockResolvedValue(null);
    const res = await PATCH(req({ logoUrl: null }));
    expect(requireFirmRole).toHaveBeenCalledWith("admin");
    expect(res.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it("owner/admin can update; non-image payload rejected", async () => {
    requireFirmRole.mockResolvedValue({ userId: "u", email: null, firmId: "f", role: "admin" });
    expect((await PATCH(req({ logoUrl: "data:image/png;base64,AAAA" }))).status).toBe(200);
    expect(update).toHaveBeenCalledTimes(1);
    expect((await PATCH(req({ logoUrl: "javascript:alert(1)" }))).status).toBe(400);
    expect(validateLogo("data:text/html;base64,AAAA").ok).toBe(false);
  });
});
