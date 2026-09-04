# Subscription validity and entitlement are two different predicates

`_valid_subscription_conditions` answers "is this subscription valid right now?" and is
shared by every genuinely-subscribed read — the admin grant-guard, the admin search
`subscribed` flag, the admin dashboard list — so they can never drift apart. A row is
valid iff:

    status IN (active, trialing)
    AND ended_at IS NULL
    AND (current_period_start IS NULL OR current_period_start <= now)
    AND (current_period_end   IS NULL OR current_period_end   >  now)

A NULL bound is open-ended: NULL start means "already started", NULL end means "never
expires" (manual comps, see ADR-0005). Only an explicit future start or a past end
disqualifies a row.

## Consequences

`_entitling_condition` is deliberately different: it additionally honors grace states
(`past_due`, `unpaid`) regardless of the period clock, because a user in billing retry
should keep access. The admin grant-guard excludes grace on purpose, so an admin can
comp a lapsed account.

Callers supply the `BillingSubscription` themselves (and join `BillingCustomer` for
user-scoped reads); these conditions reference `BillingSubscription` columns only.
