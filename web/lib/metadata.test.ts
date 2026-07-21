import { describe, it, expect } from "vitest";
import { ROUTES } from "./routes";
import { PAGE_META, buildMetadata } from "./metadata";
import { SITE } from "@/content/site";

describe("page metadata", () => {
  it("covers every route", () => {
    for (const route of ROUTES) {
      expect(PAGE_META[route]).toBeDefined();
    }
    expect(Object.keys(PAGE_META)).toHaveLength(ROUTES.length);
  });

  it("keeps titles and descriptions inside what Google will show", () => {
    // Past these lengths the SERP truncates, wasting the only pitch a searcher
    // reads before deciding whether to click.
    for (const route of ROUTES) {
      const { title, description } = PAGE_META[route];
      expect(title.length).toBeGreaterThan(0);
      expect(title.length).toBeLessThanOrEqual(60);
      expect(description.length).toBeGreaterThan(0);
      expect(description.length).toBeLessThanOrEqual(160);
    }
  });

  it("gives every route unique copy", () => {
    const titles = ROUTES.map((r) => PAGE_META[r].title);
    const descriptions = ROUTES.map((r) => PAGE_META[r].description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("sets an absolute canonical per route", () => {
    for (const route of ROUTES) {
      const canonical = buildMetadata(route).alternates?.canonical;
      expect(canonical).toBe(route === "/" ? SITE.url : `${SITE.url}${route}`);
      expect(String(canonical).startsWith("https://")).toBe(true);
    }
  });
});
