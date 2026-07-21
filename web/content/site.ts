import type { SiteConfig } from "./types";

/**
 * OPEN DEPENDENCIES — these placeholders must be replaced before cutover.
 * See the plan's "Open dependencies" section.
 *
 *   1. appStoreUrl + appStoreId — the hero CTA and the Smart App Banner both
 *      need these. Nothing ships without them.
 *   3. socials — footer links.
 *
 * They are typed as strings rather than `string | null` so the layout code stays
 * simple; content/site.test.ts asserts the placeholders are gone, so a build
 * that still contains them fails the suite rather than shipping silently.
 */
export const SITE: SiteConfig = {
  name: "TrueSwing",
  url: "https://trueswing.se",
  tagline: "Not an AI coach. A practice plan you'll actually stick to.",
  description:
    "You already know your swing fault. TrueSwing turns it into an ordered practice program that blends range drills with prescribed on-course play, and shows you that you showed up.",

  appStoreUrl: "REPLACE_ME_APP_STORE_URL",
  appStoreId: "REPLACE_ME_APP_STORE_ID",

  socials: {
    instagram: "REPLACE_ME_INSTAGRAM_URL",
    facebook: "REPLACE_ME_FACEBOOK_URL",
    discord: "REPLACE_ME_DISCORD_URL",
  },
};

/** Sentinel used by tests to catch unreplaced open dependencies. */
export const PLACEHOLDER_PREFIX = "REPLACE_ME_";
