import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchUsers } from "./search-users";

function mockFetch(impl: () => Promise<Response> | Response) {
  vi.stubGlobal("fetch", vi.fn(impl));
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("searchUsers", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.test";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("200 with an array → returns rows", async () => {
    const rows = [{ id: "1", name: "Ada", email: "ada@x.com" }];
    mockFetch(() => json(rows));
    expect(await searchUsers("tok", "ada")).toEqual(rows);
  });

  it("non-ok status → null", async () => {
    mockFetch(() => json({ detail: "forbidden" }, 403));
    expect(await searchUsers("tok", "ada")).toBeNull();
  });

  it("network throw → null", async () => {
    mockFetch(() => {
      throw new Error("ECONNREFUSED");
    });
    expect(await searchUsers("tok", "ada")).toBeNull();
  });

  it("200 but non-array body → null", async () => {
    mockFetch(() => json({ not: "an array" }));
    expect(await searchUsers("tok", "ada")).toBeNull();
  });

  it("encodes the query and passes limit", async () => {
    const spy = vi.fn(() => json([]));
    mockFetch(spy);
    await searchUsers("tok", "a b", { limit: 5 });
    expect(spy).toHaveBeenCalledWith(
      "https://api.test/api/v1/users/search/?q=a%20b&limit=5",
      expect.objectContaining({ cache: "no-store" }),
    );
  });
});
