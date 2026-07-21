import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Post-build assertions. Run with `npm run test:html` AFTER `npm run build`.
 *
 * These read out/ from disk and are the only tests that prove the thing this
 * whole project exists for: that the copy is in the static HTML rather than
 * injected by JavaScript. deploy.sh runs them as a hard gate.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
