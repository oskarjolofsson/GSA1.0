/**
 * Authenticated fetch against the TrueSwing API.
 *
 * Centralises the boilerplate every admin-side call repeats:
 *   - read the base URL from NEXT_PUBLIC_API_URL (missing → cannot call)
 *   - attach `Authorization: Bearer <token>`
 *   - `cache: "no-store"` (admin data is never safe to cache)
 *   - swallow network/DNS errors into a single sentinel
 *
 * Returns `null` for the two "we never reached a real HTTP response" cases —
 * missing base URL and a thrown fetch — so callers can treat both as "couldn't
 * reach the API". A real `Response` (including 4xx/5xx) is returned as-is; the
 * caller decides what each status means.
 *
 *   `path` is the API path including the leading slash, e.g. "/api/v1/users/all/".
 */
export async function authedFetch(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<Response | null> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return null;

  try {
    return await fetch(`${base}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    return null;
  }
}
