import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deleteUserRequest } from "./delete-user";

function mockFetch(impl: () => Promise<Response> | Response) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

const ID = "11111111-1111-1111-1111-111111111111";

describe("deleteUserRequest", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.test";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true on 204", async () => {
    mockFetch(() => new Response(null, { status: 204 }));
    expect(await deleteUserRequest(ID, "tok")).toBe(true);
  });

  it("returns false on a 4xx", async () => {
    mockFetch(() => new Response("nope", { status: 404 }));
    expect(await deleteUserRequest(ID, "tok")).toBe(false);
  });

  it("returns false on a 5xx", async () => {
    mockFetch(() => new Response("boom", { status: 500 }));
    expect(await deleteUserRequest(ID, "tok")).toBe(false);
  });

  it("returns false when fetch throws (network down)", async () => {
    mockFetch(() => {
      throw new Error("ECONNREFUSED");
    });
    expect(await deleteUserRequest(ID, "tok")).toBe(false);
  });

  it("returns false when the base URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(await deleteUserRequest(ID, "tok")).toBe(false);
  });

  it("sends a DELETE to the right URL with a Bearer header", async () => {
    const spy = vi.fn(() => new Response(null, { status: 204 }));
    mockFetch(spy);
    await deleteUserRequest(ID, "abc123");
    expect(spy).toHaveBeenCalledWith(
      `https://api.test/api/v1/users/${ID}/`,
      expect.objectContaining({
        method: "DELETE",
        cache: "no-store",
        headers: expect.objectContaining({ Authorization: "Bearer abc123" }),
      }),
    );
  });
});
