import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Nav } from "./Nav";
import { NAV_LINKS } from "@/content/nav";
import { SITE } from "@/content/site";

afterEach(cleanup);

describe("Nav", () => {
  it("renders every section link with the right href", () => {
    render(<Nav />);
    for (const link of NAV_LINKS) {
      const el = screen.getByRole("link", { name: link.label });
      expect(el.getAttribute("href")).toBe(link.href);
    }
  });

  it("sends the Download button to the App Store", () => {
    render(<Nav />);
    const cta = screen.getByRole("link", { name: "Download" });
    expect(cta.getAttribute("href")).toBe(SITE.appStoreUrl);
    // Plausible's outbound-link script reads this to attribute the conversion.
    expect(cta.getAttribute("data-section")).toBe("nav");
  });

  it("links the wordmark home", () => {
    render(<Nav />);
    // The logo is alt="" (decorative, the wordmark beside it carries the name),
    // so the accessible name comes from the text.
    const home = screen.getByRole("link", { name: /True\s*Swing/ });
    expect(home.getAttribute("href")).toBe("/");
  });

  it("labels the section nav for screen readers", () => {
    render(<Nav />);
    expect(screen.getByRole("navigation", { name: "Sections" })).toBeDefined();
  });
});
