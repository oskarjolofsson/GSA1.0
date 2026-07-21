import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NAV_LINKS, NAV_TARGET_IDS } from "./nav";

/**
 * The guard against a nav link that scrolls nowhere.
 *
 * Reads the component sources and checks that every anchor the nav points at is
 * an id something actually renders. A broken anchor is silent in the browser —
 * the click just does nothing — so it has to fail here instead.
 */
const COMPONENTS = resolve(process.cwd(), "components/landing");

function renderedIds(): Set<string> {
  const files = [
    "StartWithYourIssue.tsx",
    "Program.tsx",
    "Faq.tsx",
    "Problem.tsx",
    "Proof.tsx",
  ];
  const ids = new Set<string>();
  for (const file of files) {
    const src = readFileSync(resolve(COMPONENTS, file), "utf-8");
    for (const match of src.matchAll(/id="([a-z-]+)"/g)) ids.add(match[1]);
  }
  return ids;
}

describe("nav links", () => {
  it("only points at sections that render", () => {
    const ids = renderedIds();
    for (const link of NAV_LINKS) {
      expect(link.href.startsWith("#"), `${link.href} should be an anchor`).toBe(true);
      expect(ids.has(link.href.slice(1)), `no section renders ${link.href}`).toBe(true);
    }
  });

  it("keeps NAV_TARGET_IDS in step with NAV_LINKS", () => {
    expect(NAV_LINKS.map((l) => l.href.slice(1)).sort()).toEqual(
      [...NAV_TARGET_IDS].sort(),
    );
  });

  it("has non-empty, unique labels", () => {
    const labels = NAV_LINKS.map((l) => l.label);
    expect(new Set(labels).size).toBe(labels.length);
    for (const label of labels) expect(label.trim().length).toBeGreaterThan(0);
  });
});
