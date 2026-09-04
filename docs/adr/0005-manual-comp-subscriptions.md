# Manual comp subscriptions are ordinary rows with provider="manual"

An admin grant is a `billing_subscriptions` row with `provider="manual"` and
`status="active"`. `entitlement_service.is_subscribed()` already returns true for it,
so comping an account required no changes to entitlement logic at all. A revoke
soft-ends the row (`status=canceled`, `ended_at=now`) so entitlement flips to false
while the history survives.

## Consequences

Manual grants deliberately do not touch Stripe or RevenueCat. Revoke is scoped to
manual rows only: ending a provider-synced row here would simply be recreated by the
next webhook.
