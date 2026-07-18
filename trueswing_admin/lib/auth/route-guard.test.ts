import { describe, it, expect } from "vitest";
import { authRedirect } from "./route-guard";

describe("authRedirect", () => {
  it("sends a signed-out user on a protected route to /login", () => {
    expect(
      authRedirect({ hasSession: false, pathname: "/technical/users" }),
    ).toBe("/login");
  });

  it("lets a signed-out user reach /login", () => {
    expect(authRedirect({ hasSession: false, pathname: "/login" })).toBeNull();
  });

  it("lets the OAuth callback through without a session", () => {
    expect(
      authRedirect({ hasSession: false, pathname: "/auth/callback" }),
    ).toBeNull();
  });

  it("bounces a signed-in user away from /login", () => {
    expect(authRedirect({ hasSession: true, pathname: "/login" })).toBe("/");
  });

  it("lets a signed-in user reach a protected route", () => {
    expect(
      authRedirect({ hasSession: true, pathname: "/technical/users" }),
    ).toBeNull();
  });
});
