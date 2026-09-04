# Content images are served from a public R2 bucket

`lib/images.ts` is the one place the image origin lives; content files call
`img("name.webp")` and never see the base. The base comes from `NEXT_PUBLIC_IMAGE_BASE`,
inlined at build time, with a literal fallback so the build stays safe if the variable is
missing and so vitest — which does not load `.env` — can resolve `img()`. It is a public
URL, so a hardcoded default is harmless. Caching is Cloudflare's, on the bucket.

## Consequences

`output: "export"` forces `images.unoptimized: true`, so `next/image` passes `src` through
unchanged and these strings are the final `<img src>`. If `unoptimized` is ever turned
off, this host must be added to `images.remotePatterns` in `next.config.ts` or every
content image breaks.
