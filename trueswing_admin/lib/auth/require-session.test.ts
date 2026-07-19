import { describe, it, expect, vi, beforeEach } from "vitest";

const { getSession, createClient, redirect } = vi.hoisted(() => {
  const getSession = vi.fn();
  return {
    getSession,
    createClient: vi.fn(async () => ({ auth: { getSession } })),
    redirect: vi.fn((to: string) => {
      throw new Error(`REDIRECT:${to}`);
    }),
  };
});

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("next/navigation", () => ({ redirect }));

import { getSessionToken, requireSessionToken } from "./require-session";

describe("getSessionToken", () => {
  beforeEach(() => getSession.mockReset());

  it("returns the access token when a session exists", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "tok" } } });
    expect(await getSessionToken()).toBe("tok");
  });

  it("returns null when there is no session", async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    expect(await getSessionToken()).toBeNull();
  });
});

describe("requireSessionToken", () => {
  beforeEach(() => {
    getSession.mockReset();
    redirect.mockClear();
  });

  it("returns the token when a session exists", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "tok" } } });
    expect(await requireSessionToken()).toBe("tok");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to /login when there is no session", async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    await expect(requireSessionToken()).rejects.toThrow("REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
