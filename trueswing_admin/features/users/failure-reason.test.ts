import { describe, expect, it } from "vitest";

import { deleteUserFailureReason } from "./failure-reason";

describe("deleteUserFailureReason", () => {
  it("returns nothing for success", () => {
    expect(deleteUserFailureReason({ status: "ok" })).toBeUndefined();
  });

  it("passes a 409 detail through verbatim", () => {
    // The backend refuses to drop the profile while the auth user survives, and
    // names the id. That sentence is the only way an admin learns the account is
    // intact rather than half-deleted, so it must not be replaced with generic copy.
    const detail =
      "Supabase still reports auth user 1234 after the delete call. The profile was left in place so the account stays administrable.";
    expect(deleteUserFailureReason({ status: "conflict", detail })).toBe(detail);
  });

  it("says the account is already gone on 404", () => {
    expect(deleteUserFailureReason({ status: "notFound" })).toMatch(/already/i);
  });

  it("does not leak backend wording for auth failures", () => {
    expect(deleteUserFailureReason({ status: "denied", detail: "raw" })).toMatch(
      /aren't authorized/i,
    );
  });

  it("treats an unreachable API as retryable", () => {
    expect(deleteUserFailureReason({ status: "error" })).toMatch(/try again/i);
  });
});
