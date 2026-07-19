import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getSubscribers } from "./get-subscribers";

function mockFetch(impl: () => Promise<Response> | Response) {
  vi.stubGlobal("fetch", vi.fn(impl));
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const PAGE = { items: [], total: 0, limit: 10, offset: 0 };

describe("getSubscribers", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.test";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("200 with a page body → ok + data", async () => {
    mockFetch(() => json(PAGE));
    expect(await getSubscribers("tok", { limit: 10, offset: 0 })).toEqual({
      status: "ok",
      data: PAGE,
    });
  });

  it("403 → denied", async () => {
    mockFetch(() => json({ detail: "forbidden" }, 403));
    expect(await getSubscribers("tok", { limit: 10, offset: 0 })).toEqual({
      status: "denied",
    });
  });

  it("500 → error", async () => {
    mockFetch(() => new Response("boom", { status: 500 }));
    expect(await getSubscribers("tok", { limit: 10, offset: 0 })).toEqual({
      status: "error",
    });
  });

  it("200 but body missing items[] → error", async () => {
    mockFetch(() => json({ total: 0 }));
    expect(await getSubscribers("tok", { limit: 10, offset: 0 })).toEqual({
      status: "error",
    });
  });

  it("passes limit/offset in the query", async () => {
    const spy = vi.fn(() => json(PAGE));
    mockFetch(spy);
    await getSubscribers("tok", { limit: 25, offset: 50 });
    expect(spy).toHaveBeenCalledWith(
      "https://api.test/api/v1/admin/subscriptions/?limit=25&offset=50",
      expect.objectContaining({ cache: "no-store" }),
    );
  });
});
