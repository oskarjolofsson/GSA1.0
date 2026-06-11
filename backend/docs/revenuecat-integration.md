# RevenueCat (mobile billing) integration

How the mobile app (React Native / Expo, separate repo) sells the premium
subscription through App Store / Play Store in-app purchases, and how the backend
folds those purchases into the same entitlement model that Stripe web billing uses.

> **Why RevenueCat at all?** Apple and Google require digital subscriptions bought
> inside a native app to go through their in-app purchase systems — you cannot run
> Stripe Checkout there. RevenueCat is the abstraction over StoreKit / Play Billing
> and emits server-side webhooks we ingest. Stripe stays the billing provider for
> the **web** app; RevenueCat is the billing provider for **mobile**. Both write to
> the same tables.

---

## Architecture

```
  WEB                                   MOBILE (Expo app, other repo)
  React app ── Stripe Checkout          RC SDK (appUserID = supabase user.id)
       │                                     │ buys via App Store / Play Store
  Stripe ── webhook ──┐              RevenueCat (SaaS)
                      │                      │ webhook (Authorization: <shared secret>)
                      ▼                      ▼
   POST /api/v1/webhook/stripe/   POST /api/v1/webhook/revenuecat/
                      │                      │
                      └──────────┬───────────┘
                                 ▼
              billing_customers / billing_subscriptions
                 (provider = "stripe" | "revenuecat")
                                 ▼
        entitlement_service.can_access_premium_features(user_id)
           = any active subscription (any provider) OR free tier
                                 ▼
                 GET /api/v1/billing/status   (now returns `provider`)
```

The mobile app never calls a checkout endpoint on our backend — the purchase
happens through the RevenueCat SDK against the stores. RevenueCat tells **us**
about it via the webhook, and tells the **app** about it via the SDK's entitlement
object. The backend `/status` endpoint stays the cross-platform source of truth.

---

## What the mobile app uses from the backend

The mobile client uses the **same** authenticated billing API as the web app. All
requests send the Supabase JWT as `Authorization: Bearer <access_token>`.

| Endpoint | Method | Used by mobile? | Purpose |
|----------|--------|-----------------|---------|
| `GET /api/v1/billing/status` | GET | **Yes** | Cross-platform entitlement + subscription summary. Now includes `provider`. |
| `POST /api/v1/billing/checkout-session/` | POST | No | Stripe web checkout. Mobile uses the RC SDK instead. |
| `GET /api/v1/billing/portal/` | GET | No | Stripe customer portal (web only). Mobile manages subs in the App Store / Play Store. |
| `POST /api/v1/webhook/revenuecat/` | POST | No (RevenueCat → backend) | Webhook ingress. Not called by the app. |

### `GET /api/v1/billing/status` response

```jsonc
{
  "is_subscribed": true,
  "has_free_tier": false,
  "can_access_premium": true,
  "free_tier_expires_at": "2026-06-18T10:00:00+00:00",
  "subscription": {
    "provider": "revenuecat",          // NEW: "stripe" | "revenuecat"
    "status": "active",                // trialing | active | past_due | canceled | ...
    "current_period_end": "2026-07-10T10:00:00+00:00",
    "cancel_at_period_end": false,
    "canceled_at": null,
    "ended_at": null
  }
}
```

**Recommended mobile pattern:** gate UI on the RevenueCat SDK's entitlement object
for instant, offline-capable checks, and treat `GET /billing/status` as the
authoritative server-side check (e.g. before unlocking server-side premium work).
Premium backend endpoints already return **HTTP 402** when the user is not
entitled; handle 402 in the app the same way the web app does.

> **`provider` and "manage subscription".** Because a subscription can now be
> Apple/Google-managed, a client should route "Manage subscription" by `provider`:
> `stripe` → open the Stripe customer portal (web); `revenuecat` → deep-link to the
> App Store / Play Store subscription management screen. The Stripe portal cannot
> manage a store subscription.

---

## RevenueCat dashboard setup

1. **Project & apps.** Create a RevenueCat project. Add an App Store app (with the
   App Store Connect shared secret) and a Play Store app (with the Play service
   account credentials).

2. **Products.** Create the subscription products in App Store Connect and the Play
   Console first, then import them into RevenueCat. Keep pricing roughly at parity
   with the Stripe web price (note Apple/Google take 15–30%).

3. **Entitlement.** Create a single entitlement (e.g. `premium`) and attach all
   subscription products to it. The app checks this entitlement; the exact product
   id does not matter to our backend beyond storage.

4. **Offering.** Create a default offering with the packages the paywall shows.

5. **Webhook.** Settings → Integrations → Webhooks:
   - **URL:** `https://<your-api-host>/api/v1/webhook/revenuecat/`
   - **Authorization header:** set a strong random secret. This exact value must
     equal the backend env var (below). RevenueCat replays it on every request;
     the backend compares it in constant time and returns **401** on mismatch.
   - **Environment:** enable both Sandbox and Production events while testing.

6. **App User ID.** The app must initialise the SDK with
   `appUserID = supabase user.id` **after login** (see below). Do not use anonymous
   ids — the backend maps `app_user_id` straight to `profiles.id`.

---

## Mobile app responsibilities (other repo — for reference)

Login is required before purchase, so the RevenueCat identity always equals the
Supabase user id.

```ts
import Purchases from 'react-native-purchases';

// 1. Configure once, with the platform API key.
Purchases.configure({ apiKey: RC_PUBLIC_SDK_KEY });

// 2. On login (and on app start if already signed in), identify with the
//    Supabase user id so every RevenueCat event/webhook carries it.
await Purchases.logIn(supabaseUser.id);

// 3. On logout:
await Purchases.logOut();

// 4. Paywall: fetch offerings and purchase.
const offerings = await Purchases.getOfferings();
const pkg = offerings.current?.availablePackages[0];
const { customerInfo } = await Purchases.purchasePackage(pkg);

// 5. Gate locally on the entitlement; confirm server-side via GET /billing/status.
const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
```

The store purchase → RevenueCat → our webhook round-trip is asynchronous. After a
successful purchase, the app can poll `GET /billing/status` (the web app already
does this on its success screen) until `is_subscribed` flips, or rely on the SDK's
`customerInfo` for the immediate unlock.

---

## Backend configuration

Set the webhook shared secret (must match the dashboard's Authorization header
value). `core/config.py` selects sandbox vs live by the `DEV` flag, same as Stripe:

```bash
# .env (DEV=TRUE)
SANDBOX_REVENUECAT_WEBHOOK_AUTH_TOKEN=<random secret matching the RC sandbox webhook>

# .env.production (DEV unset/false)
LIVE_REVENUECAT_WEBHOOK_AUTH_TOKEN=<random secret matching the RC live webhook>
```

If the token is unset, the webhook **fails closed** (rejects every event) — it never
accepts unauthenticated calls.

### How the backend maps a RevenueCat event

- **Idempotency:** the RC `event.id` is stored (namespaced `revenuecat:<id>`) in
  `processed_webhook_events`; duplicate deliveries are no-ops.
- **User:** `event.app_user_id` (and `aliases`) is parsed as a UUID and matched to
  `profiles.id`. Unknown users are logged and acknowledged with 200 (so RevenueCat
  stops retrying) — no row is written.
- **Customer:** a `billing_customers` row with `provider="revenuecat"`,
  `customer_id = original_app_user_id`.
- **Subscription:** a `billing_subscriptions` row with `provider="revenuecat"`,
  `external_subscription_id = original_transaction_id` (stable across renewals).
  Out-of-order deliveries are dropped via the `last_event_at` guard. The full event
  is stored in the `raw` JSONB column.

### Event → status mapping

The derived `status` must fall inside `ACTIVE_SUBSCRIPTION_STATUSES`
(`trialing, active, past_due, unpaid`) for the row to grant entitlement.

| RevenueCat event | status | notes |
|------------------|--------|-------|
| `INITIAL_PURCHASE`, `RENEWAL`, `PRODUCT_CHANGE`, `UNCANCELLATION`, `SUBSCRIPTION_EXTENDED` | `active` (`trialing` if `period_type=TRIAL`) | clears cancel flags |
| `CANCELLATION` | `active` | `cancel_at_period_end=true`, `canceled_at` set — still entitled until expiry |
| `BILLING_ISSUE` | `past_due` | grace period, still entitled |
| `EXPIRATION`, `SUBSCRIPTION_PAUSED` | `canceled` | `ended_at` set — entitlement revoked |
| `TRANSFER` | — | ensures the receiving user has a RC customer; full row reassignment is deferred |
| other (`TEST`, etc.) | — | acknowledged, not persisted |

---

## Preventing double subscriptions

A user could end up paying twice — once on web (Stripe) and once on mobile
(RevenueCat) — because the two providers don't know about each other. How much the
backend can do about it depends entirely on which side initiates the purchase.

| Scenario | Blocked server-side? | Why |
|----------|----------------------|-----|
| Web sub, then web again | **Yes** | `checkout-session/` is our endpoint |
| Mobile sub, then web | **Yes** | guard checks all providers (below) |
| Web sub, then buys on mobile | **No** | the store owns the purchase; backend only hears about it via webhook *after* the charge |
| Mobile sub, then mobile again | **No** (cross-store) | RevenueCat dedupes within a store; cross-store it can't |

**Web guard (enforced).** `billing_service.start_subscription_checkout` calls
`get_active_subscriptions_for_user(user_id)`, which joins across **all** of the
user's customers and providers, and raises **409 Conflict** if any active
subscription exists. So a web checkout is refused on top of an active Stripe *or*
RevenueCat subscription. (It also looks up the user's Stripe customer specifically
via `get_customer_by_user_and_provider(user_id, "stripe")` — a RevenueCat
customer_id must never be passed to Stripe.)

**Mobile side (not enforceable).** The App Store / Play Store purchase never
touches our backend, so the server cannot reject "this user already has a web sub."
Mitigations live in the app and in reconciliation:
1. **Client soft guard** — before showing the paywall, call `GET /billing/status`;
   if `is_subscribed`, show "manage subscription" instead of the paywall. Stops
   accidental double-buys; bypassable, not authoritative.
2. **Detect + reconcile** — a user with two active subs across providers is a
   billing (not access) problem; resolve via refund (both Stripe and RevenueCat
   support it).

Importantly, a double subscription does **not** break access: `can_access_premium`
is "any active sub," so entitlement stays correct. It's a double-charge concern.

## Testing

- **Local replay:** start the API and `curl` a sample event (the
  `tests/api/billing/test_revenuecat_webhook.py` fixtures are good payload models):

  ```bash
  curl -X POST http://localhost:8000/api/v1/webhook/revenuecat/ \
    -H "Authorization: $SANDBOX_REVENUECAT_WEBHOOK_AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"api_version":"1.0","event":{"id":"evt_1","type":"INITIAL_PURCHASE",
         "event_timestamp_ms":1710000000000,"app_user_id":"<supabase-uuid>",
         "original_app_user_id":"<supabase-uuid>","product_id":"premium_monthly",
         "period_type":"NORMAL","purchased_at_ms":1710000000000,
         "expiration_at_ms":4102444800000,"original_transaction_id":"txn_1",
         "store":"APP_STORE","environment":"SANDBOX"}}'
  ```

  Then `GET /api/v1/billing/status` for that user should report
  `is_subscribed: true` with `provider: "revenuecat"`.

- **Automated:** `pytest tests/ -k revenuecat` (unit + end-to-end), and the full
  billing suite (`pytest tests/service/billing tests/api/billing`) to confirm no
  Stripe regression.

- **Sandbox purchase:** once the Expo app is wired up, make a sandbox purchase and
  confirm the same row lands; RevenueCat sends `environment: "SANDBOX"` for those.
