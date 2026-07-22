/**
 * Every content image is served from the public R2 bucket. This is the one
 * place the origin lives — content files call img("name.webp") and never see
 * the base. Caching is handled by Cloudflare on the bucket, not here.
 *
 * The base comes from NEXT_PUBLIC_IMAGE_BASE (set in web/.env), inlined at
 * build time. The literal fallback keeps the build safe if the var is ever
 * missing and lets vitest (which doesn't load .env) resolve img() — it's a
 * public URL, so a hardcoded default is harmless.
 *
 * Note: with images.unoptimized:true (forced by output:"export") next/image
 * passes src through unchanged, so these strings are the final <img src>. If
 * unoptimized is ever turned off, this host must be added to
 * images.remotePatterns in next.config.ts.
 */
export const IMAGE_BASE =
  process.env.NEXT_PUBLIC_IMAGE_BASE ??
  "https://cdn.trueswing.se";

export function img(name: string): string {
  return `${IMAGE_BASE}/${name}`;
}

