/**
 * Three-state result for an authenticated admin GET. See ADR-0010.
 *
 * Never collapse denied and error: one is a permission state (show "no access"), the
 * other an outage (show "try again").
 */
export type FetchResult<T> =
  | { status: "ok"; data: T }
  | { status: "denied" }
  | { status: "error" };

/**
 * Map an `authedFetch` outcome to a `FetchResult`.
 *
 * `parse` validates and shapes the body; return `null` to reject an unexpected
 * payload — it becomes `error`, never a silent empty success.
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

/**
 * Result of an authenticated admin mutation (POST/DELETE/PATCH).
 *
 * The branches map 1:1 to the backend's exception handlers
 * (backend/app/exception_handlers.py); `detail` carries their human message so the UI
 * can surface it verbatim.
 */
export type MutationResult =
  | { status: "ok" }
  | { status: "invalidState"; detail?: string }
  | { status: "unauthorized"; detail?: string }
  | { status: "denied"; detail?: string }
  | { status: "notFound"; detail?: string }
  | { status: "conflict"; detail?: string }
  | { status: "invalidInput"; detail?: string }
  | { status: "serviceUnavailable"; detail?: string }
  | { status: "error"; detail?: string };

const STATUS_TO_MUTATION: Record<number, MutationResult["status"]> = {
  400: "invalidState",
  401: "unauthorized",
  403: "denied",
  404: "notFound",
  409: "conflict",
  422: "invalidInput",
  502: "serviceUnavailable",
};

/**
 * Map an `authedFetch` outcome to a `MutationResult`.
 *
 * Any 2xx is `ok`; unknown non-2xx and `null` (network / missing base URL) fall
 * through to `error`.
 */
export async function toMutationResult(
  res: Response | null,
): Promise<MutationResult> {
  if (!res) return { status: "error" };
  if (res.ok) return { status: "ok" };

  const status = STATUS_TO_MUTATION[res.status] ?? "error";

  let detail: string | undefined;
  try {
    const body = (await res.json()) as { detail?: unknown };
    if (typeof body.detail === "string") detail = body.detail;
  } catch {
    // Non-JSON or empty body — leave detail undefined.
  }

  return { status, detail };
}
