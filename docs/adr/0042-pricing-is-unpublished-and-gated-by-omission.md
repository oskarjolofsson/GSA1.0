# Pricing is unpublished, gated by a missing import rather than a flag

`<Pricing />` is deliberately not imported in `app/page.tsx`. Two conflicting prices exist
in the legacy codebase and neither is confirmed: `frontend/.../prices.tsx` said EUR
14.99/month (in a component itself commented out of the landing page) and
`frontend/.../PricingPage.tsx` said EUR 9, marked `// TODO: replace placeholder copy +
price`. A wrong price on the page built to rank in Google is the number people screenshot
and quote back at you, so publishing waits for a real one.

## Consequences

The gate is the missing import, not `PRICING_PUBLISHED`. That constant is documentation
and a test target only — branching on a flag inside JSX would still ship the price string
in the JS bundle, where it can be scraped while invisible on the page.

To publish: set `priceMinor` and `currency`, set `PRICING_PUBLISHED = true`, import and
render `<Pricing />` in `app/page.tsx`, and update `tests/static-html.test.ts`, which
currently asserts the price is absent.
