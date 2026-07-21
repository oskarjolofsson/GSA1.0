import type { PricingPlan } from "./types";

/**
 * NOT PUBLISHED. See app/page.tsx — <Pricing /> is deliberately not imported.
 *
 * Two conflicting prices exist in the legacy codebase and neither is confirmed:
 *   - frontend/src/features/landing/components/prices.tsx  -> EUR 14.99/month
 *     (and that component was itself commented out of the landing page)
 *   - frontend/src/features/billing/screens/PricingPage.tsx -> EUR 9
 *     (marked `// TODO: replace placeholder copy + price`)
 *
 * A wrong price on the page built to rank in Google is the number people
 * screenshot and quote back at you. Publishing waits for a real one.
 *
 * TO PUBLISH:
 *   1. Set priceMinor and currency to the confirmed values.
 *   2. Set PRICING_PUBLISHED = true.
 *   3. Import and render <Pricing /> in app/page.tsx.
 *   4. Update tests/static-html.test.ts, which currently asserts it is absent.
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
