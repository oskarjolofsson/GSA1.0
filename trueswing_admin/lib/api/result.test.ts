import { describe, it, expect } from "vitest";
import { toResult } from "./result";

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
