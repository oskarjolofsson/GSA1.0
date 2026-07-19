import { describe, it, expect, vi, beforeEach } from "vitest";

const { getSessionToken, verifyAdmin } = vi.hoisted(() => ({
  getSessionToken: vi.fn(),
  verifyAdmin: vi.fn(),
}));

vi.mock("@/lib/auth/require-session", () => ({ getSessionToken }));
vi.mock("@/lib/auth/verify-admin", () => ({ verifyAdmin }));

import { withAdmin } from "./with-admin";

describe("withAdmin", () => {
  beforeEach(() => {
    getSessionToken.mockReset();
    verifyAdmin.mockReset();
  });

  it("returns fallback when there is no session token (fn never runs)", async () => {
    getSessionToken.mockResolvedValue(null);
    const fn = vi.fn();
    expect(await withAdmin(fn, { ok: false })).toEqual({ ok: false });
    expect(fn).not.toHaveBeenCalled();
    expect(verifyAdmin).not.toHaveBeenCalled();
  });

  it("returns fallback when not an admin (denied / error), fn never runs", async () => {
    getSessionToken.mockResolvedValue("tok");
    const fn = vi.fn();
    for (const status of ["denied", "error"] as const) {
      verifyAdmin.mockResolvedValue(status);
      expect(await withAdmin(fn, { ok: false })).toEqual({ ok: false });
    }
    expect(fn).not.toHaveBeenCalled();
  });

  it("runs fn with the token when admin", async () => {
    getSessionToken.mockResolvedValue("tok");
    verifyAdmin.mockResolvedValue("admin");
    const fn = vi.fn(async (t: string) => ({ ok: true, seen: t }));
    expect(await withAdmin(fn, { ok: false })).toEqual({ ok: true, seen: "tok" });
    expect(fn).toHaveBeenCalledWith("tok");
  });
});
