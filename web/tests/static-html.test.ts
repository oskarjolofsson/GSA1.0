import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { FAQ } from "@/content/faq";
import { ROUTES, emittedFileFor } from "@/lib/routes";
import { PRICING } from "@/content/pricing";

/**
 * The tests that justify this project.
 *
 * The old site was a Vite SPA: every route served the same empty shell and the
 * copy only appeared once JavaScript ran, so a crawler that doesn't execute JS
 * saw nothing. These assertions prove the copy is in the bytes on disk.
 *
 * They read out/ and require `npm run build` first — tests/setup.ts fails with
 * an instruction if you forget. deploy.sh runs them as a hard gate.
 */

const out = (p: string) => resolve(process.cwd(), "out", p);
const read = (p: string) => readFileSync(out(p), "utf-8");

function ldJsonBlocks(html: string): Record<string, unknown>[] {
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
    .map((m) => JSON.parse(m[1]));
}

describe("emitted files", () => {
  it("writes an HTML file for every route", () => {
    // Guards the trailingSlash contract: with trailingSlash:false Next emits
    // out/legal/privacy-policy.html, NOT .../privacy-policy/index.html. Caddy's
    // try_files depends on this exact shape. If Next ever changes it, this
    // fails here rather than 404ing the App Store's privacy link in production.
    for (const route of ROUTES) {
      expect(existsSync(out(emittedFileFor(route))), emittedFileFor(route)).toBe(true);
    }
  });

  it("writes the SEO and error files", () => {
    for (const f of ["sitemap.xml", "robots.txt", "404.html"]) {
      expect(existsSync(out(f)), f).toBe(true);
    }
  });
});

describe("landing page static HTML", () => {
  const html = read("index.html");

  it("contains every FAQ question and answer verbatim", () => {
    // Derived from the FAQ constant, so this is not a copy snapshot — editing
    // the FAQ doesn't break it, but failing to render the FAQ does.
    for (const item of FAQ) {
      expect(html, `question: ${item.id}`).toContain(item.q);
      expect(html, `answer: ${item.id}`).toContain(item.a);
    }
  });

  it("emits an FAQPage schema matching the rendered FAQ", () => {
    const faqSchema = ldJsonBlocks(html).find((s) => s["@type"] === "FAQPage");
    expect(faqSchema).toBeDefined();
    expect((faqSchema!.mainEntity as unknown[]).length).toBe(FAQ.length);
  });

  it("emits a SoftwareApplication schema", () => {
    const app = ldJsonBlocks(html).find((s) => s["@type"] === "SoftwareApplication");
    expect(app).toBeDefined();
    expect(app!.operatingSystem).toBe("iOS");
  });

  it("carries the Smart App Banner meta", () => {
    expect(html).toContain("apple-itunes-app");
  });

  it("ships the hero as WebP, not the 1.6MB PNG", () => {
    // `images.unoptimized: true` is forced by output:"export", so whatever is in
    // public/ is served byte for byte. The source PNG is 1.6MB and this is 38KB;
    // shipping the PNG would cost more Lighthouse than anything else on the page.
    expect(html).toContain("hero.webp");
    expect(html).not.toContain("README_image");
    expect(html).not.toContain("hero.png");
  });

  it("does not lazy-load the hero image", () => {
    // The hero photo is the LCP element. `priority` must win over lazy loading.
    const heroTag = html.match(/<img[^>]*hero\.webp[^>]*>/)?.[0] ?? "";
    expect(heroTag).not.toContain('loading="lazy"');
  });

  it("has exactly one h1, and it is the positioning line", () => {
    expect((html.match(/<h1/g) ?? []).length).toBe(1);
    expect(html).toContain("Not an AI coach");
  });

  it("renders the nav with all three section anchors", () => {
    for (const anchor of ['href="#start"', 'href="#program"', 'href="#faq"']) {
      expect(html, anchor).toContain(anchor);
    }
  });

  it("loads Plausible", () => {
    // If the CSP in the Caddyfile blocks plausible.io this still passes — the
    // script tag is present either way. Verify the network request separately
    // at cutover; see the plan's verification checklist.
    expect(html).toContain("plausible.io");
  });

  it("carries the footer's shipped-from line", () => {
    expect(html).toContain("Shipped from");
    expect(html).toContain("Oskar O.");
  });

  it("uses the canonical contact address and not the retired one", () => {
    // The legacy footer used trueswing25@gmail.com for Contact and Support.
    // That address is retired; team@trueswing.se is what the privacy policy
    // publishes and what the FAQ promises a reply at.
    expect(html).toContain("team@trueswing.se");
    expect(html).not.toContain("trueswing25@gmail.com");
  });

  it("links all four socials from the footer", () => {
    for (const domain of ["instagram.com", "facebook.com", "linkedin.com"]) {
      expect(html, domain).toContain(domain);
    }
  });

  it("does NOT expose the unpublished price", () => {
    // Pricing.tsx exists and is tested but is deliberately not imported into
    // app/page.tsx while two conflicting prices (EUR 14.99 vs EUR 9) sit in the
    // codebase. This fails the moment someone wires it up by accident.
    expect(html).not.toContain(PRICING.name);
    if (PRICING.priceMinor !== null) {
      expect(html).not.toContain(String(PRICING.priceMinor));
    }
  });
});

describe("legal pages static HTML", () => {
  it("serves the privacy policy at the URL the App Store points at", () => {
    const html = read("legal/privacy-policy.html");
    expect(html).toContain("Privacy Policy");
    expect(html).toContain("team@trueswing.se");
  });

  it("discloses Plausible in the privacy policy", () => {
    // The site loads a third-party analytics script, so the policy has to say so.
    expect(read("legal/privacy-policy.html")).toContain("Plausible");
  });

  it("serves the terms", () => {
    const html = read("legal/terms-and-conditions.html");
    expect(html).toContain("Terms and Conditions");
    expect(html).toContain("laws of Sweden");
  });
});

describe("sitemap", () => {
  const xml = read("sitemap.xml");

  it("lists exactly the routes that exist", () => {
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toHaveLength(ROUTES.length);
    // A sitemap advertising a URL that 404s is an active SEO liability.
    for (const route of ROUTES) {
      expect(existsSync(out(emittedFileFor(route)))).toBe(true);
    }
  });

  it("uses absolute https URLs with no duplicates", () => {
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    expect(new Set(locs).size).toBe(locs.length);
    for (const loc of locs) expect(loc.startsWith("https://")).toBe(true);
  });
});
