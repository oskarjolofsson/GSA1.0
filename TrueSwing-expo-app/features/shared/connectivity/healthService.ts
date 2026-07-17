const API = process.env.EXPO_PUBLIC_API_URL;

/**
 * Reachability probe for the backend. We hit the API root (`GET /`, which returns
 * name/version/commit) with no auth token — we're testing whether the server
 * answers at all, not whether the caller is authorized. Any HTTP response means
 * the backend is up; a network error or timeout means it's unreachable.
 *
 *   fetch ${API}/ ──► response (any status) ──► true  (reachable)
 *                └──► abort / network error ──► false (unreachable)
 */
export async function pingBackend(timeoutMs = 5000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    await fetch(`${API}/`, { method: 'GET', signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
