/**
 * Nav links. Every href is an on-page anchor; content/nav.test.ts asserts each one
 * matches a section that actually renders.
 *
 * #program, #proof and #problem render but are deliberately absent — two links is
 * enough, and nobody navigates to "the problem" on purpose.
 */
export const NAV_LINKS = [
  { href: "#start", label: "How it works" },
  { href: "#faq", label: "Questions" },
] as const;

/** Section ids the nav depends on. Kept explicit so the test can assert them. */
export const NAV_TARGET_IDS = ["start", "faq"] as const;
