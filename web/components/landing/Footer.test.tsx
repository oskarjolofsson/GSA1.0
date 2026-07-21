import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Footer } from "./Footer";
import { FOOTER } from "@/content/landing";
import { SITE } from "@/content/site";

afterEach(cleanup);

describe("Footer", () => {
  it("renders every link column", () => {
    render(<Footer />);
    for (const column of FOOTER.columns) {
      expect(
        screen.getByRole("heading", { name: column.heading, level: 2 }),
      ).toBeDefined();
    }
  });

  it("points both legal links at real routes", () => {
    // These two URLs are load-bearing: the App Store listing links the privacy
    // policy. A typo here is a dead required link on a live listing.
    render(<Footer />);
    expect(
      screen.getByRole("link", { name: "Privacy Policy" }).getAttribute("href"),
    ).toBe("/legal/privacy-policy");
    expect(
      screen.getByRole("link", { name: "Terms" }).getAttribute("href"),
    ).toBe("/legal/terms-and-conditions");
  });

  it("resolves the contact token to the canonical address", () => {
    render(<Footer />);
    for (const label of ["Contact", "Support"]) {
      const href = screen.getByRole("link", { name: label }).getAttribute("href");
      expect(href).toBe(`mailto:${SITE.contactEmail}`);
      // The token must never survive into rendered markup.
      expect(href).not.toContain("CONTACT_EMAIL");
    }
  });

  it("renders all four social icons with accessible names", () => {
    render(<Footer />);
    for (const social of FOOTER.socials) {
      const link = screen.getByRole("link", {
        name: new RegExp(`^${social.label}`),
      });
      expect(link.getAttribute("href")).toBe(SITE.socials[social.id]);
      expect(link.getAttribute("rel")).toContain("noopener");
    }
  });

  it("keeps the shipped-from line", () => {
    render(<Footer />);
    expect(screen.getByText(/Shipped from/)).toBeDefined();
    expect(screen.getByText(/Oskar O\./)).toBeDefined();
  });
});
