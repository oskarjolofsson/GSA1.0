import type { PricingPlan } from "./types";

/**
 * NOT PUBLISHED — <Pricing /> is deliberately not imported in app/page.tsx, and
 * `priceMinor` is null because no price is confirmed.
 *
 * See ADR-0042 for why the gate is the missing import and for the steps to publish.
 */
export const PRICING: PricingPlan = {
  id: "premium",
  name: "TrueSwing Premium",
  priceMinor: null,
  currency: "EUR",
  interval: "month",
  features: [
    "Turn your coach's notes into a program",
    "Unlimited swing uploads and re-tests",
    "The full drill library",
    "Progress history across every program",
  ],
};

/**
 * Documentation and a test target, not a runtime switch. The gate is the
 * missing import in app/page.tsx — branching on a flag in JSX would still ship
 * the price string inside the JS bundle, where it can be scraped while
 * invisible on the page.
 */
export const PRICING_PUBLISHED = false;
