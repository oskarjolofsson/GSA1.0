/**
 * Pure routing decision for the auth middleware. Kept free of Next/Supabase
 * types so it is trivially unit-testable.
 *
 *   hasSession=false, protected route  ─▶ send to /login
 *   hasSession=true,  on /login         ─▶ send to /
 *   otherwise                            ─▶ null (let the request through)
 *
 * Public paths need no session: the login page itself, and the OAuth callback
 * (the code-for-session exchange happens before a session exists).
 */
const PUBLIC_PATHS = ["/login", "/auth/callback"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export function authRedirect({
  hasSession,
  pathname,
}: {
  hasSession: boolean;
  pathname: string;
}): string | null {
  if (!hasSession && !isPublic(pathname)) return "/login";
  if (hasSession && pathname === "/login") return "/";
  return null;
}
