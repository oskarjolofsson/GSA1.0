import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAllUsers } from "./get-all-users";

function mockFetch(impl: () => Promise<Response> | Response) {
  vi.stubGlobal("fetch", vi.fn(impl));
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("getAllUsers", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.test";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("200 with a user array → ok + data", async () => {
    const users = [{ id: "1", name: "Ada", email: "ada@x.com" }];
    mockFetch(() => json(users));
    expect(await getAllUsers("tok")).toEqual({ status: "ok", data: users });
  });

  it("403 → denied", async () => {
    mockFetch(() => json({ detail: "forbidden" }, 403));
    expect(await getAllUsers("tok")).toEqual({ status: "denied" });
  });

  it("500 → error", async () => {
    mockFetch(() => new Response("boom", { status: 500 }));
    expect(await getAllUsers("tok")).toEqual({ status: "error" });
  });

  it("network throw → error", async () => {
    mockFetch(() => {
      throw new Error("ECONNREFUSED");
    });
    expect(await getAllUsers("tok")).toEqual({ status: "error" });
  });

  it("200 but non-array body → error", async () => {
    mockFetch(() => json({ not: "an array" }));
    expect(await getAllUsers("tok")).toEqual({ status: "error" });
  });
});
