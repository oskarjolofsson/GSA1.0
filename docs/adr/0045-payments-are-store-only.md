# Payments are store-only; the Stripe integration is removed

TrueSwing sold subscriptions two ways: Stripe Checkout on the web, and App Store /
Play Store in-app purchases through RevenueCat. The web product is retired — the
remaining `web/` app is a landing page that ships zero JavaScript and does not
publish pricing (ADR-0041, ADR-0042) — so Stripe had no way to reach a buyer. No
valid `provider='stripe'` subscription existed when this was decided.

Carrying a payment integration that nothing calls is worse than carrying ordinary
dead code: it is unmonitored, untested against a live account, and it reads to a
future contributor as a supported purchase path. So the Stripe integration is
deleted rather than parked behind a flag: `core/infrastructure/payment/stripe/`,
`billing_service.py` (which was entirely Stripe), `POST /billing/checkout-session/`,
`GET /billing/portal/`, `POST /webhook/stripe/`, the `STRIPE_*` config, and the
`stripe` dependency. The live keys and dashboard webhook were revoked after the
merge.

## Consequences

`billing_customers` and `billing_subscriptions` keep their `provider` column and stay
provider-agnostic. The legal values are now `revenuecat` (a store purchase) and
`manual` (an admin comp, ADR-0005); `stripe` remains legal as *history* on any
already-ended row. The `DEFAULT 'stripe'` on both columns was dropped — every writer
passes `provider` explicitly, and a default naming a provider that no longer exists
would mislabel a future insert.

`GET /api/v1/billing/status` is unchanged and is still the single entitlement
surface. Clients must handle `provider: 'manual'`: a comp has no store subscription
behind it, so there is nowhere to send the user to manage it.

Re-adding web billing later is a fresh integration, not a revert. That is the
accepted cost: this decision assumes the product stays mobile-only.
