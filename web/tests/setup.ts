import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Fail fast with an instruction rather than an ENOENT twenty lines into the
 * first assertion. These tests read the build output, so a missing out/ means
 * "you forgot to build", not "the site is broken".
 */
const indexHtml = resolve(process.cwd(), "out/index.html");

if (!existsSync(indexHtml)) {
  throw new Error(
    "out/index.html not found.\n\n" +
      "These are post-build assertions — run `npm run build` first,\n" +
      "or `npm run test:all` to do the whole sequence.\n",
  );
}
