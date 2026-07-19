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

/**
 * Result of an authenticated admin mutation (POST/DELETE/PATCH).
 *
 * The write-side counterpart to `FetchResult`. Where reads only needed
 * ok/denied/error, mutations can fail in ways the caller wants to distinguish
 * ("already subscribed" vs "no such user" vs "try again"). The statuses map
 * 1:1 to the backend's exception handlers (backend/app/exception_handlers.py),
 * every one of which responds `{ detail: string }`:
 *
 *   2xx                                    ─▶ ok
 *   400 InvalidStateException               ─▶ invalidState
 *   401 Authentication/UnauthorizedException ─▶ unauthorized
 *   403 ForbiddenException                  ─▶ denied
 *   404 NotFoundException                   ─▶ notFound
 *   409 ConflictException                   ─▶ conflict
 *   422 Validation/InvalidVideoException    ─▶ invalidInput
 *   502 StripeInfrastructureError           ─▶ serviceUnavailable
 *   500 / null / any other non-2xx          ─▶ error
 *
 * `detail` carries the backend's human message on the failure branches so the
 * UI can surface it verbatim (mirrors the frontend apiClient reading
 * `errorData.detail`).
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
 * A 2xx (including 201/204) is `ok`. Any known error status maps to its named
 * branch and best-effort reads `{ detail }` off the body; unknown non-2xx and
 * `null` (network / missing base URL) fall through to `error`.
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
