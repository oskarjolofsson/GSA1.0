import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyAdmin } from "./verify-admin";

function mockFetch(impl: () => Promise<Response> | Response) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("verifyAdmin", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.test";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 'admin' when is_admin is true", async () => {
    mockFetch(() => json({ is_admin: true }));
    expect(await verifyAdmin("tok")).toBe("admin");
  });

  it("returns 'denied' when is_admin is false", async () => {
    mockFetch(() => json({ is_admin: false }));
    expect(await verifyAdmin("tok")).toBe("denied");
  });

  it("returns 'denied' on a 403", async () => {
    mockFetch(() => json({ detail: "forbidden" }, 403));
    expect(await verifyAdmin("tok")).toBe("denied");
  });

  it("returns 'error' on a 500", async () => {
    mockFetch(() => new Response("boom", { status: 500 }));
    expect(await verifyAdmin("tok")).toBe("error");
  });

  it("returns 'error' when fetch throws (network down)", async () => {
    mockFetch(() => {
      throw new Error("ECONNREFUSED");
    });
    expect(await verifyAdmin("tok")).toBe("error");
  });

  it("returns 'error' when the base URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(await verifyAdmin("tok")).toBe("error");
  });

  it("sends the token as a Bearer header", async () => {
    const spy = vi.fn(() => json({ is_admin: true }));
    mockFetch(spy);
    await verifyAdmin("abc123");
    expect(spy).toHaveBeenCalledWith(
      "https://api.test/api/v1/admin/verify/",
      expect.objectContaining({
        headers: { Authorization: "Bearer abc123" },
        cache: "no-store",
      }),
    );
  });
});
