import type { SiteConfig } from "./types";

/**
 * OPEN DEPENDENCIES — anything still carrying PLACEHOLDER_PREFIX must be
 * replaced before cutover. content/site.test.ts enumerates what is still
 * outstanding, so a forgotten placeholder fails the suite rather than shipping.
 *
 * Remaining: none — all values below are real. If you add a new field with a
 * REPLACE_ME_ placeholder, add it to OUTSTANDING in content/site.test.ts.
 *
 * Closed: appStoreUrl + appStoreId (hero/footer CTA, Smart App Banner),
 * socials.discord (the FAQ promises a Discord), and the Instagram, Facebook and
 * LinkedIn URLs recovered from the legacy footer.
 */
export const SITE: SiteConfig = {
  name: "TrueSwing",
  url: "https://trueswing.se",
  tagline: "Not an AI coach. A practice plan you'll actually stick to.",
  description:
    "You already know your swing fault. TrueSwing turns it into an ordered practice program that blends range drills with prescribed on-course play, and shows you that you showed up.",

  appStoreUrl: "https://apps.apple.com/se/app/true-swing-golf-analysis/id6763497771",
  appStoreId: "id6763497771",

  /**
   * Canonical contact address. The privacy policy publishes this, the FAQ
   * promises a reply at it, and the footer links it twice. The legacy footer
   * used trueswing25@gmail.com — that address is retired, and
   * tests/static-html.test.ts asserts it never reaches the build output.
   */
  contactEmail: "team@trueswing.se",

  socials: {
    instagram: "https://www.instagram.com/trueswing25/",
    facebook: "https://www.facebook.com/people/True-Swing/61585578701767/",
    linkedin: "https://www.linkedin.com/company/110780177/",
    discord: "https://discord.gg/EsMHGjRG6Q",
  },
};

/** Sentinel used by tests to catch unreplaced open dependencies. */
export const PLACEHOLDER_PREFIX = "REPLACE_ME_";
