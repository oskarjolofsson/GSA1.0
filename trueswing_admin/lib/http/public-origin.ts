import { type NextRequest } from "next/server";

/**
 * Resolve the *public* origin the browser used, from behind the Caddy reverse proxy.
 *
 * In the container the app binds to 0.0.0.0:3000, so `request.url` reports that
 * internal address and redirecting to it dead-ends at https://0.0.0.0:3000. The real
 * hostname survives only in the proxy's forwarded headers; falls back to the request's
 * own origin for local dev, where there is no proxy.
 */
export function publicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}
