import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setUserRole } from "./set-user-role";

function mockFetch(impl: () => Promise<Response> | Response) {
  vi.stubGlobal("fetch", vi.fn(impl));
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("setUserRole", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.test";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("200 → ok", async () => {
    mockFetch(() => json({ id: "1", role: "admin" }));
    expect(await setUserRole("1", "admin", "tok")).toEqual({ status: "ok" });
  });

  it("403 (own role) → denied", async () => {
    mockFetch(() => json({ detail: "You can't change your own role" }, 403));
    expect(await setUserRole("1", "user", "tok")).toEqual({
      status: "denied",
      detail: "You can't change your own role",
    });
  });

  it("500 → error", async () => {
    mockFetch(() => new Response("boom", { status: 500 }));
    expect(await setUserRole("1", "admin", "tok")).toEqual({ status: "error" });
  });

  it("network throw → error", async () => {
    mockFetch(() => {
      throw new Error("ECONNREFUSED");
    });
    expect(await setUserRole("1", "admin", "tok")).toEqual({ status: "error" });
  });

  it("sends PATCH with role body to the right URL", async () => {
    const spy = vi.fn(() => json({ id: "1", role: "admin" }));
    mockFetch(spy);
    await setUserRole("abc", "admin", "tok");
    expect(spy).toHaveBeenCalledWith(
      "https://api.test/api/v1/users/abc/role/",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ role: "admin" }),
        cache: "no-store",
      }),
    );
  });
});
