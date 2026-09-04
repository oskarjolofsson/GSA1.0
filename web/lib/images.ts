/**
 * The one place the content-image origin lives; content files call img("name.webp").
 *
 * See ADR-0043 — in particular, turning off `images.unoptimized` requires adding
 * this host to `images.remotePatterns`.
 */
export const IMAGE_BASE =
  process.env.NEXT_PUBLIC_IMAGE_BASE ??
  "https://cdn.trueswing.se";

export function img(name: string): string {
  return `${IMAGE_BASE}/${name}`;
}

