/**
 * Every route this site serves. Single source for sitemap.ts and the
 * post-build assertions in tests/static-html.test.ts.
 *
 * These paths are byte-identical to the legacy react-router paths in
 * frontend/src/app/router.jsx. The App Store listing's required privacy URL
 * points at /legal/privacy-policy — changing it breaks a live listing.
 */
export const ROUTES = [
  "/",
  "/legal/privacy-policy",
  "/legal/terms-and-conditions",
] as const;

export type Route = (typeof ROUTES)[number];

/**
 * Emitted file for a route under `output: "export"` with `trailingSlash: false`.
 * Next writes `/legal/privacy-policy` as `out/legal/privacy-policy.html`, and
 * `/` as `out/index.html`. Caddy resolves the extensionless request via
 * `try_files {path} {path}.html`.
 */
export function emittedFileFor(route: Route): string {
  return route === "/" ? "index.html" : `${route.slice(1)}.html`;
}
