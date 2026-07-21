import { PRICING } from "@/content/pricing";

/**
 * BUILT BUT NOT PUBLISHED — app/page.tsx does not import this.
 *
 * The gate is the missing import, not a runtime flag: a `{FLAG && <Pricing/>}`
 * would still bundle the price string into the JS, where it is scrapeable while
 * invisible. Not importing it means the price never reaches the output at all,
 * which tests/static-html.test.ts asserts.
 *
 * See content/pricing.ts for the four steps to publish.
 */
export function Pricing() {
  const price =
    PRICING.priceMinor === null
      ? null
      : (PRICING.priceMinor / 100).toFixed(2).replace(/\.00$/, "");

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="mx-auto w-full max-w-3xl px-6 py-24"
    >
      <h2
        id="pricing-heading"
        className="font-display text-3xl font-bold text-sand sm:text-4xl"
      >
        Pricing
      </h2>

      <div className="mt-10 rounded-3xl border border-gold/30 bg-ink-raised/60 p-8">
        <h3 className="font-display text-xl font-semibold text-gold">
          {PRICING.name}
        </h3>

        <p className="mt-4 font-display text-4xl font-bold text-sand">
          {price === null ? (
            <span className="text-2xl text-sand-dim">Pricing coming soon</span>
          ) : (
            <>
              {PRICING.currency === "EUR" ? "€" : "kr"}
              {price}
              <span className="ml-1 font-sans text-base font-normal text-sand-dim">
                /{PRICING.interval}
              </span>
            </>
          )}
        </p>

        <ul className="mt-6 space-y-3">
          {PRICING.features.map((feature) => (
            <li key={feature} className="flex gap-3 text-sand-dim">
              <span aria-hidden="true" className="text-gold">
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
