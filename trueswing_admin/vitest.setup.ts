import { afterEach } from "vitest";

/**
 * Shared setup for every suite, node and jsdom alike.
 *
 * Testing Library only registers its own afterEach cleanup when Vitest runs with
 * `globals: true`, which this project does not. Without it each render stacks on
 * top of the last and queries fail with "found multiple elements". Registering it
 * here means component tests get isolation for free.
 *
 * Guarded on `document` because the same setup file loads for the node suites,
 * which must not pull in a DOM library.
 */
if (typeof document !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");
  afterEach(cleanup);
}
