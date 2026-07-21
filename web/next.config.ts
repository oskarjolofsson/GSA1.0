import type { NextConfig } from "next";

/**
 * Static marketing site. Nothing here runs on a server.
 *
 * `output: "export"` silently disables redirects(), rewrites() and headers() —
 * they do not warn, they just do nothing. Everything they would have done lives
 * in the Caddyfile instead (security headers, cache headers, legacy redirects).
 * See web/Caddyfile and /srv/trueswing/Caddyfile.
 */
const nextConfig: NextConfig = {
  output: "export",

  // Required under `export`: the default image loader needs a server.
  // We ship pre-sized assets and set explicit width/height to avoid CLS.
  images: {
    unoptimized: true,
  },

  // With trailingSlash: false the export emits `out/legal/privacy-policy.html`
  // (NOT `.../index.html`). Caddy resolves the extensionless URL via try_files,
  // so `/legal/privacy-policy` stays byte-identical to the old react-router path
  // that the App Store listing points at. Do not change this without updating
  // the Caddyfile and tests/static-html.test.ts together.
  trailingSlash: false,
};

export default nextConfig;
