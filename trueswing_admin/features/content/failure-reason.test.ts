import { describe, expect, it } from "vitest";

import { contentFailureReason, isUndeletableDrill } from "./failure-reason";

describe("contentFailureReason", () => {
  it("returns nothing for success", () => {
    expect(contentFailureReason({ status: "ok" })).toBeUndefined();
  });

  it("passes a 422 detail through verbatim", () => {
    // The backend names the rejected value; replacing it with generic copy would
    // throw away the only actionable part of the message.
    const detail = "Unknown miss 'BANANA'. Allowed values: SLICE, HOOK, ...";
    expect(contentFailureReason({ status: "invalidInput", detail })).toBe(detail);
  });

  it("passes a 409 detail through verbatim", () => {
    const detail = "This issue is referenced by existing user data (3 programs...)";
    expect(contentFailureReason({ status: "conflict", detail })).toBe(detail);
  });

  it("falls back to readable copy when the backend sent no detail", () => {
    expect(contentFailureReason({ status: "invalidInput" })).toMatch(/aren't allowed/i);
    expect(contentFailureReason({ status: "conflict" })).toMatch(/conflicts/i);
  });

  it("does not leak backend wording for auth failures", () => {
    expect(contentFailureReason({ status: "denied", detail: "raw" })).toMatch(
      /aren't authorized/i,
    );
    expect(contentFailureReason({ status: "unauthorized" })).toMatch(/session expired/i);
  });

  it("treats an unreachable API as retryable", () => {
    expect(contentFailureReason({ status: "error" })).toMatch(/try again/i);
  });
});

describe("isUndeletableDrill", () => {
  it("recognises the practice-history refusal", () => {
    expect(
      isUndeletableDrill({
        status: "conflict",
        detail: "This drill has 4 recorded practice runs and cannot be deleted;",
      }),
    ).toBe(true);
  });

  it("does not treat the confirmable 409 as permanent", () => {
    // This one clears with confirm_impact=true; offering no path forward would be
    // wrong.
    expect(
      isUndeletableDrill({
        status: "conflict",
        detail: "This drill is linked to 2 issues and 0 in-flight program states.",
      }),
    ).toBe(false);
  });

  it("ignores non-conflict statuses", () => {
    expect(isUndeletableDrill({ status: "error" })).toBe(false);
  });
});
