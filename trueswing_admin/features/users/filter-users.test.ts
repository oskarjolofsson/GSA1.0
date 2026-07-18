import { describe, it, expect } from "vitest";
import { filterUsers } from "./filter-users";
import type { User } from "@/lib/users/types";

function user(partial: Partial<User> & { name: string; email: string }): User {
  return {
    id: crypto.randomUUID(),
    role: null,
    authProvider: null,
    active: null,
    analysesCount: null,
    drillsCompleted: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: null,
    ...partial,
  };
}

const ADA = user({ name: "Ada Lovelace", email: "ada@example.com" });
const ALAN = user({ name: "Alan Turing", email: "alan@bletchley.uk" });
const GRACE = user({ name: "Grace Hopper", email: "grace@navy.mil" });
const USERS = [ADA, ALAN, GRACE];

describe("filterUsers", () => {
  it("matches by name (partial)", () => {
    expect(filterUsers(USERS, "lov")).toEqual([ADA]);
  });

  it("matches by email (partial)", () => {
    expect(filterUsers(USERS, "bletchley")).toEqual([ALAN]);
  });

  it("is case-insensitive", () => {
    expect(filterUsers(USERS, "GRACE")).toEqual([GRACE]);
  });

  it("trims surrounding whitespace in the query", () => {
    expect(filterUsers(USERS, "  ada  ")).toEqual([ADA]);
  });

  it("returns [] for an empty query", () => {
    expect(filterUsers(USERS, "")).toEqual([]);
  });

  it("returns [] for a whitespace-only query", () => {
    expect(filterUsers(USERS, "   ")).toEqual([]);
  });

  it("returns [] when nothing matches", () => {
    expect(filterUsers(USERS, "zzz")).toEqual([]);
  });

  it("returns every match across the list", () => {
    // "a" appears in all three names.
    expect(filterUsers(USERS, "a")).toHaveLength(3);
  });

  it("respects the result cap", () => {
    const many = Array.from({ length: 100 }, (_, i) =>
      user({ name: `Test User ${i}`, email: `t${i}@example.com` }),
    );
    expect(filterUsers(many, "test", 50)).toHaveLength(50);
  });
});
