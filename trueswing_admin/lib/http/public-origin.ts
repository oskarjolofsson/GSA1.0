import { type NextRequest } from "next/server";

/**
 * Resolve the *public* origin the browser actually used, from behind the Caddy
 * reverse proxy.
 *
 *   Browser ──HTTPS──▶ Caddy (admin.trueswing.se) ──HTTP──▶ container (0.0.0.0:3000)
 *
 * Inside the container the app binds to 0.0.0.0:3000, so request.url /
 * request.nextUrl report that internal address — redirecting to it sends the
 * browser to a dead end (https://0.0.0.0:3000). The real hostname survives only
 * in the proxy's forwarded headers, which Caddy sets by default. Trust those;
 * fall back to the request's own origin for local/dev where there is no proxy.
 */
export function publicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}
