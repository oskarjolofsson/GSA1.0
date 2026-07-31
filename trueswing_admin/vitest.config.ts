import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    // Node is the default: the `.test.ts` suites stub global fetch and exercise
    // server-only modules, and none of them want a DOM.
    //
    // Component tests opt in per file with a `@vitest-environment jsdom` docblock
    // rather than a glob. Vitest 4 removed `environmentMatchGlobs`, and it removed
    // it silently — the option is simply ignored, so the tests fail with
    // "document is not defined" instead of a config error. The docblock cannot
    // fail that way.
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
