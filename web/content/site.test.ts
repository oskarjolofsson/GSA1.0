import { describe, it, expect } from "vitest";
import { SITE, PLACEHOLDER_PREFIX } from "./site";

/**
 * Guards the open dependencies. Every value that still carries the placeholder
 * prefix is work someone has to finish before cutover, so this test names
 * exactly what is outstanding rather than letting a REPLACE_ME_ string ship.
 */

const OUTSTANDING = ["appStoreUrl", "appStoreId", "socials.discord"] as const;

describe("site config", () => {
  it("has the recovered social URLs", () => {
    // Recovered from the legacy footer. If these regress to placeholders,
    // the footer silently links nowhere.
    expect(SITE.socials.instagram).toContain("instagram.com");
    expect(SITE.socials.facebook).toContain("facebook.com");
    expect(SITE.socials.linkedin).toContain("linkedin.com");
    for (const url of [
      SITE.socials.instagram,
      SITE.socials.facebook,
      SITE.socials.linkedin,
    ]) {
      expect(url.startsWith("https://")).toBe(true);
    }
  });

  it("uses the canonical contact address", () => {
    // The privacy policy publishes this and the FAQ promises a reply at it.
    // The legacy gmail address is retired.
    expect(SITE.contactEmail).toBe("team@trueswing.se");
    expect(SITE.contactEmail).not.toContain("gmail");
  });

  it("has an absolute production origin with no trailing slash", () => {
    expect(SITE.url).toBe("https://trueswing.se");
    expect(SITE.url.endsWith("/")).toBe(false);
  });

  it("only has the known outstanding placeholders", () => {
    // Fails loudly when a NEW placeholder appears, and reminds you what is
    // still open. Delete entries from OUTSTANDING as you fill them in.
    const remaining: string[] = [];
    if (SITE.appStoreUrl.startsWith(PLACEHOLDER_PREFIX)) remaining.push("appStoreUrl");
    if (SITE.appStoreId.startsWith(PLACEHOLDER_PREFIX)) remaining.push("appStoreId");
    for (const [key, value] of Object.entries(SITE.socials)) {
      if (value.startsWith(PLACEHOLDER_PREFIX)) remaining.push(`socials.${key}`);
    }
    expect(remaining.sort()).toEqual([...OUTSTANDING].sort());
  });
});
