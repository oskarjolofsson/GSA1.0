/**
 * Active-route test shared by the top tabs and the technical sidebar.
 *
 * exact=false → prefix match: "/technical" stays active on "/technical/users".
 * exact=true  → full match:   sidebar rows highlight only their own page.
 */
export function isActive(pathname: string, href: string, exact = false) {
  return exact ? pathname === href : pathname.startsWith(href);
}
