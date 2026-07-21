/**
 * Shared content types.
 *
 * Everything under content/ is plain data with NO React imports. That is
 * load-bearing: because content/faq.ts cannot render itself, both the Faq
 * component and the FAQPage JSON-LD generator are forced to consume the same
 * array. Schema-vs-rendered drift becomes impossible rather than merely tested.
 *
 * Legal prose is deliberately NOT modelled here — see app/legal/. Exact wording
 * carries legal weight on the one URL Apple verifies, so it is ported as
 * faithful text rather than restructured into typed blocks.
 */

export interface FaqItem {
  /** Slug of the question. Drives JSON-LD entries, DOM anchors and React keys. */
  readonly id: string;
  readonly q: string;
  readonly a: string;
}

export interface PricingPlan {
  readonly id: string;
  readonly name: string;
  /** Minor units (e.g. 1499 = 14.99). `null` until a real price is confirmed. */
  readonly priceMinor: number | null;
  readonly currency: "SEK" | "EUR";
  readonly interval: "month" | "year";
  readonly features: readonly string[];
}

export interface SiteConfig {
  readonly name: string;
  /** Production origin, no trailing slash. Baked in at build time. */
  readonly url: string;
  readonly tagline: string;
  readonly description: string;
  /** App Store listing URL. OPEN DEPENDENCY — placeholder until confirmed. */
  readonly appStoreUrl: string;
  /** Numeric App Store id for the Smart App Banner. OPEN DEPENDENCY. */
  readonly appStoreId: string;
  readonly socials: {
    readonly instagram: string;
    readonly facebook: string;
    readonly discord: string;
  };
}
