import { describe, it, expect } from "vitest";
import { toResult, toMutationResult } from "./result";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const parseJson = (r: Response) => r.json();

describe("toResult", () => {
  it("null response (no base URL / thrown fetch) → error", async () => {
    expect(await toResult(null, parseJson)).toEqual({ status: "error" });
  });

  it("403 → denied", async () => {
    expect(await toResult(json({ detail: "forbidden" }, 403), parseJson)).toEqual({
      status: "denied",
    });
  });

  it("other non-2xx (500) → error", async () => {
    expect(
      await toResult(new Response("boom", { status: 500 }), parseJson),
    ).toEqual({ status: "error" });
  });

  it("200 with valid body → ok + data", async () => {
    expect(await toResult(json({ a: 1 }), parseJson)).toEqual({
      status: "ok",
      data: { a: 1 },
    });
  });

  it("200 but parse returns null → error (never a silent empty success)", async () => {
    expect(await toResult(json("not-an-array"), async () => null)).toEqual({
      status: "error",
    });
  });

  it("200 but parse throws (unparseable body) → error", async () => {
    const bad = new Response("<<not json>>", { status: 200 });
    expect(await toResult(bad, (r) => r.json())).toEqual({ status: "error" });
  });
});

describe("toMutationResult", () => {
  it("null response → error", async () => {
    expect(await toMutationResult(null)).toEqual({ status: "error" });
  });

  it("2xx (201/204) → ok", async () => {
    expect(await toMutationResult(new Response(null, { status: 201 }))).toEqual({
      status: "ok",
    });
    expect(await toMutationResult(new Response(null, { status: 204 }))).toEqual({
      status: "ok",
    });
  });

  it.each([
    [400, "invalidState"],
    [401, "unauthorized"],
    [403, "denied"],
    [404, "notFound"],
    [409, "conflict"],
    [422, "invalidInput"],
    [502, "serviceUnavailable"],
  ] as const)("maps %i → %s and carries detail", async (code, expected) => {
    const res = json({ detail: "backend says" }, code);
    expect(await toMutationResult(res)).toEqual({
      status: expected,
      detail: "backend says",
    });
  });

  it("unknown non-2xx (418) → error", async () => {
    expect(
      await toMutationResult(new Response("teapot", { status: 418 })),
    ).toMatchObject({ status: "error" });
  });

  it("500 → error", async () => {
    expect(
      await toMutationResult(json({ detail: "Internal Error" }, 500)),
    ).toEqual({ status: "error", detail: "Internal Error" });
  });

  it("error status with a non-JSON body → status, detail undefined", async () => {
    const res = new Response("<<not json>>", { status: 409 });
    expect(await toMutationResult(res)).toEqual({
      status: "conflict",
      detail: undefined,
    });
  });
});
