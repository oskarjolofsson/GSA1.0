import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authedFetch } from "./authed-fetch";

function mockFetch(impl: () => Promise<Response> | Response) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

describe("authedFetch", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.test";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds the URL from base + path and attaches Bearer + no-store", async () => {
    const spy = vi.fn(() => new Response(null, { status: 200 }));
    mockFetch(spy);

    await authedFetch("/api/v1/users/all/", "abc123");

    expect(spy).toHaveBeenCalledWith(
      "https://api.test/api/v1/users/all/",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({ Authorization: "Bearer abc123" }),
      }),
    );
  });

  it("merges caller init (method + headers) with the auth header", async () => {
    const spy = vi.fn(() => new Response(null, { status: 204 }));
    mockFetch(spy);

    await authedFetch("/api/v1/users/x/", "tok", {
      method: "DELETE",
      headers: { "X-Test": "1" },
    });

    const [, init] = spy.mock.calls[0];
    expect(init.method).toBe("DELETE");
    expect(init.headers).toMatchObject({
      "X-Test": "1",
      Authorization: "Bearer tok",
    });
    expect(init.cache).toBe("no-store");
  });

  it("returns the Response even for error statuses", async () => {
    mockFetch(() => new Response("nope", { status: 500 }));
    const res = await authedFetch("/x/", "tok");
    expect(res?.status).toBe(500);
  });

  it("returns null when fetch throws (network down)", async () => {
    mockFetch(() => {
      throw new Error("ECONNREFUSED");
    });
    expect(await authedFetch("/x/", "tok")).toBeNull();
  });

  it("returns null when the base URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    const spy = vi.fn();
    mockFetch(spy);
    expect(await authedFetch("/x/", "tok")).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});
