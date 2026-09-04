/**
 * Public paths need no session: the login page, and the OAuth callback — the
 * code-for-session exchange happens before a session exists.
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
