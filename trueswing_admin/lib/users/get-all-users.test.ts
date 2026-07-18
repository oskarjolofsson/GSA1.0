import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAllUsers } from "./get-all-users";
import type { User } from "./types";

function mockFetch(impl: () => Promise<Response> | Response) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const USER: User = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "ada@example.com",
  name: "Ada Lovelace",
  role: "user",
  authProvider: "google",
  active: true,
  analysesCount: 3,
  drillsCompleted: 12,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: null,
};

describe("getAllUsers", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.test";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the typed array on 200", async () => {
    mockFetch(() => json([USER]));
    const users = await getAllUsers("tok");
    expect(users).toEqual([USER]);
  });

  it("returns null when the body is not an array", async () => {
    mockFetch(() => json({ oops: true }));
    expect(await getAllUsers("tok")).toBeNull();
  });

  it("returns null on a 403", async () => {
    mockFetch(() => json({ detail: "forbidden" }, 403));
    expect(await getAllUsers("tok")).toBeNull();
  });

  it("returns null on a 500", async () => {
    mockFetch(() => new Response("boom", { status: 500 }));
    expect(await getAllUsers("tok")).toBeNull();
  });

  it("returns null when fetch throws (network down)", async () => {
    mockFetch(() => {
      throw new Error("ECONNREFUSED");
    });
    expect(await getAllUsers("tok")).toBeNull();
  });

  it("returns null when the base URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(await getAllUsers("tok")).toBeNull();
  });

  it("sends the token as a Bearer header with no-store", async () => {
    const spy = vi.fn(() => json([USER]));
    mockFetch(spy);
    await getAllUsers("abc123");
    expect(spy).toHaveBeenCalledWith(
      "https://api.test/api/v1/users/all/",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({ Authorization: "Bearer abc123" }),
      }),
    );
  });
});
