/**
 * Nav links.
 *
 * Every href here is an on-page anchor, because this site is one scrolling page
 * plus two legal routes. content/nav.test.ts asserts each anchor matches a
 * section id that actually renders — a nav link that scrolls nowhere is the
 * classic way this breaks.
 *
 * Section ids: HowItWorks carries #start (the section) and #program (card 2);
 * Faq carries #faq. Problem (#problem) and HowItWorks's #proof card also exist
 * but are deliberately not in the nav — three links is enough, and "The problem"
 * is not something anyone navigates to on purpose.
 */
export const NAV_LINKS = [
  { href: "#start", label: "How it works" },
  { href: "#program", label: "The program" },
  { href: "#faq", label: "Questions" },
] as const;

/** Section ids the nav depends on. Kept explicit so the test can assert them. */
export const NAV_TARGET_IDS = ["start", "program", "faq"] as const;
