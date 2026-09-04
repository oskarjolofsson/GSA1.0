import { afterEach } from "vitest";

/**
 * Shared setup for every suite, node and jsdom alike.
 *
 * Testing Library registers its own afterEach cleanup only under `globals: true`, which
 * this project does not use; without this, renders stack up and queries fail with "found
 * multiple elements". Guarded on `document` because the node suites load this file too.
 */
if (typeof document !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");
  afterEach(cleanup);
}
