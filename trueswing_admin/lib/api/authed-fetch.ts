/**
 * Authenticated fetch against the TrueSwing API: NEXT_PUBLIC_API_URL as the base,
 * bearer token, `cache: "no-store"`. `path` includes the leading slash.
 *
 * Returns `null` for the two cases where no HTTP response happened at all — missing
 * base URL and a thrown fetch. A real `Response`, 4xx/5xx included, comes back as-is.
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
