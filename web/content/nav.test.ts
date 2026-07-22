import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NAV_LINKS, NAV_TARGET_IDS } from "./nav";
import { HOW_IT_WORKS } from "./howItWorks";

/**
 * The guard against a nav link that scrolls nowhere.
 *
 * Reads the component sources and checks that every anchor the nav points at is
 * an id something actually renders. A broken anchor is silent in the browser —
 * the click just does nothing — so it has to fail here instead.
 *
 * HowItWorks renders its step anchors (#program, #proof) from data, not literal
 * `id="..."` strings, so those come from HOW_IT_WORKS directly; the section's
 * own #start is a literal in the source and is picked up by the scan.
 */
const COMPONENTS = resolve(process.cwd(), "components/landing");

function renderedIds(): Set<string> {
  const files = ["HowItWorks.tsx", "Faq.tsx", "Problem.tsx"];
  const ids = new Set<string>();
  for (const file of files) {
    const src = readFileSync(resolve(COMPONENTS, file), "utf-8");
    for (const match of src.matchAll(/id="([a-z-]+)"/g)) ids.add(match[1]);
  }
  for (const step of HOW_IT_WORKS.steps) ids.add(step.id);
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
