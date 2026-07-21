import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Unit tests. Run with `npm run test` — no build required.
 *
 * Post-build assertions live in a separate config (vitest.html.config.ts)
 * because they read the emitted out/ directory and are meaningless without a
 * build. Keeping them apart means `npm run test` is always safe to run.
 *
 * Note: trueswing_admin's config includes only `**\/*.test.ts`, so `.test.tsx`
 * files there are silently skipped. This one covers both.
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["{app,lib,components,content}/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "out", "tests/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
