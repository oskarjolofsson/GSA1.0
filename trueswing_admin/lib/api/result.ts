/**
 * Three-state result for an authenticated admin GET.
 *
 * Lets a page tell "not an admin" (403) apart from "couldn't reach the API"
 * (missing base URL / network / 5xx / bad body) without a separate verify call —
 * the data endpoint is itself `require_admin`, so its status already carries the
 * admin verdict. Never collapse denied and error together: one is a permission
 * state (show "no access"), the other an outage (show "try again").
 */
export type FetchResult<T> =
  | { status: "ok"; data: T }
  | { status: "denied" }
  | { status: "error" };

/**
 * Map an `authedFetch` outcome to a `FetchResult`.
 *
 *   res === null (no base URL / thrown fetch) ─▶ error
 *   403                                        ─▶ denied
 *   other non-2xx                              ─▶ error
 *   2xx, parse(res) throws / returns null      ─▶ error
 *   2xx, parse(res) returns T                  ─▶ ok
 *
 * `parse` validates and shapes the body; return `null` to reject an
 * unexpected payload (treated as error, never a silent empty success).
 */
export async function toResult<T>(
  res: Response | null,
  parse: (res: Response) => Promise<T | null>,
): Promise<FetchResult<T>> {
  if (!res) return { status: "error" };
  if (res.status === 403) return { status: "denied" };
  if (!res.ok) return { status: "error" };

  try {
    const data = await parse(res);
    return data === null ? { status: "error" } : { status: "ok", data };
  } catch {
    return { status: "error" };
  }
}
