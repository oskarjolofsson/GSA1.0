# Payment — Manual comps (admin-granted subscriptions)

How an admin gives one person a subscription without a store purchase, and what the
rest of the system does with it afterwards.

A **comp** is an ordinary `billing_subscriptions` row with `provider="manual"`. It is
not backed by the App Store, Play Store, or RevenueCat, so nothing is charged and
there is no external system to keep in sync. Decision record: [ADR-0005](../../../../docs/adr/0005-manual-comp-subscriptions.md).
Payments themselves are store-only: [ADR-0045](../../../../docs/adr/0045-payments-are-store-only.md).

All routes below are under `/api/v1/admin/subscriptions` and require an admin bearer
token (🛡). See [README](../README.md) for the auth model.

---

## 1. Endpoints

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/api/v1/admin/subscriptions/` | 🛡 Admin | Paginated list of currently-valid subscribers |
| GET | `/api/v1/admin/subscriptions/search/` | 🛡 Admin | Find a person to grant to |
| POST | `/api/v1/admin/subscriptions/` | 🛡 Admin | Grant a comp |
| DELETE | `/api/v1/admin/subscriptions/{subscription_id}/` | 🛡 Admin | Revoke a comp |

### 1.1 `GET /api/v1/admin/subscriptions/` 🛡

Query params: `limit` (1–50, default 10), `offset` (≥0, default 0).

```json
{
  "items": [
    {
      "user_id": "6c1f...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "subscription_id": "0d9a...",
      "provider": "manual",
      "status": "active",
      "current_period_end": null
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}
```

Lists every currently-valid subscription across providers, not just comps — use
`provider` to tell a comp (`manual`) from a store purchase (`revenuecat`). "Currently
valid" is the same predicate the grant guard uses (see §3), so a lapsed or
period-expired row never appears here.

### 1.2 `GET /api/v1/admin/subscriptions/search/` 🛡

Query params: `q` (name or email), `limit` (1–50, default 10). An empty or
whitespace-only `q` returns `[]`.

```json
[
  {
    "user_id": "6c1f...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "subscribed": true,
    "provider": "revenuecat",
    "subscription_id": "0d9a..."
  }
]
```

`subscribed` is evaluated with the same predicate as the grant guard, so it is safe
to disable the dashboard's Grant button on `subscribed: true` — the POST would return
409 anyway.

### 1.3 `POST /api/v1/admin/subscriptions/` 🛡

Request:
```json
{ "user_id": "6c1f..." }
```

Response `201` — the granted row, shaped exactly like a list item:
```json
{
  "user_id": "6c1f...",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "subscription_id": "0d9a...",
  "provider": "manual",
  "status": "active",
  "current_period_end": null
}
```

What the grant writes:

- A `billing_customers` row with `provider="manual"` and `customer_id="manual_<user_id>"`,
  reused if the user already has one (a re-grant after a revoke does not create a second).
- A `billing_subscriptions` row with `provider="manual"`, `external_price_id="manual_comp"`,
  `status="active"`, `current_period_start=now`, and **`current_period_end=null`**.

`current_period_end: null` means a comp **never auto-expires**. It stays valid until an
admin revokes it. If you want a time-boxed comp, you have to revoke it yourself — there
is no scheduled expiry.

Errors:

| Status | When |
|--------|------|
| 404 | No profile for `user_id` |
| 409 | The user already has a currently-valid subscription (any provider) |
| 401 / 403 | Not authenticated / not an admin |

### 1.4 `DELETE /api/v1/admin/subscriptions/{subscription_id}/` 🛡

Returns `204` with no body. Soft-end only: the row is kept for history with
`status="canceled"` and `canceled_at`/`ended_at` set to now. Access ends immediately;
nothing is deleted.

| Status | When |
|--------|------|
| 404 | No subscription with that id |
| 409 | The subscription is not a comp — a `revenuecat` row has to be cancelled in the store |
| 401 / 403 | Not authenticated / not an admin |

---

## 2. What the user sees

A comp entitles exactly like a store purchase. `GET /api/v1/billing/status` returns:

```json
{
  "is_subscribed": true,
  "can_access_premium": true,
  "free_tier_expires_at": "2026-01-08T10:00:00+00:00",
  "subscription": {
    "provider": "manual",
    "status": "active",
    "current_period_end": null,
    "cancel_at_period_end": false
  }
}
```

Two things a client must handle:

- **`provider: "manual"`** — there is no store subscription behind it, so there is
  nowhere to send the user. Render the subscription state with **no** "Manage"
  action. Deep-linking to App Store / Play Store subscription settings would show
  the user nothing. The Expo app does this in
  `TrueSwing-expo-app/features/billing/components/SubscriptionCard.tsx`.
- **`current_period_end: null`** — do not render a renewal or expiry date for a comp.
  Any "renews on …" copy must be conditional on a non-null value.

Gate premium UI on `can_access_premium`, never on `provider`.

---

## 3. When a grant is allowed

The guard blocks only a **currently-valid** subscription, which means: not ended, and
either (a) `active`/`trialing` with the period started and not passed, or (b) a grace
state (`past_due`/`unpaid`, where the store is still retrying the charge).

The practical consequence: a lapsed, cancelled, or webhook-stuck row does **not**
block a comp — which is exactly the situation where an admin wants to grant one. A
paying subscriber, or someone in a billing-retry window, does.

If a user later buys in the store while holding a comp, both rows can coexist.
Entitlement is "any valid subscription", so the user simply stays entitled, and
nothing double-charges — a comp costs nothing. The store row is the one they manage;
revoke the comp when you want it gone.

---

## 4. Related

- [RevenueCat integration](./revenuecat-integration.md) — the store purchase path and
  `GET /billing/status` in full.
- [ADR-0005](../../../../docs/adr/0005-manual-comp-subscriptions.md) — why comps are an
  ordinary subscription row rather than a flag on the profile.
- [ADR-0045](../../../../docs/adr/0045-payments-are-store-only.md) — why `manual` and
  `revenuecat` are the only live provider values.
