# RevenueCat Billing — Mobile Integration Guide

This document describes how the mobile app (React Native / Expo) and the RevenueCat
dashboard integrate with the billing endpoints exposed by the backend. The backend
owns all subscription state and webhook handling; treat it as a black box behind the
routes below.

RevenueCat is the billing provider for **mobile** (App Store / Play Store in-app
purchases). Stripe stays the provider for **web** — see
[`stripe-frontend-integration.md`](./stripe-frontend-integration.md). Both feed the
same entitlement state, so `GET /api/v1/billing/status` is the single source of
truth across platforms.

The mobile app's job is to:

1. Identify the user to RevenueCat so purchases map to the right account.
2. Sell the subscription through the RevenueCat SDK (not a backend route).
3. Read the user's entitlement state from the backend and gate UI accordingly.

The mobile app **never** handles webhooks and **never** calls Stripe routes.

---

## 1. Endpoints

| Method | Path | Who calls it | Purpose |
|--------|------|--------------|---------|
| GET | `/api/v1/billing/status` | mobile app | Read the user's entitlement state |
| POST | `/api/v1/webhook/revenuecat/` | RevenueCat (not the app) | Receive purchase events |

The web-only Stripe routes (`/api/v1/billing/checkout-session/` and
`/api/v1/billing/portal/`) are **not** used by mobile — purchases and subscription
management happen through the stores via the RevenueCat SDK.

### 1.1 `GET /api/v1/billing/status`

Returns the user's current entitlement state across **all** platforms. Requires the
same bearer token used elsewhere in the app. Use this to gate UI.

Response `200`:
```json
{
  "is_subscribed": true,
  "has_free_tier": false,
  "can_access_premium": true,
  "free_tier_expires_at": "2026-06-18T10:00:00+00:00",
  "subscription": {
    "provider": "revenuecat",
    "status": "active",
    "current_period_end": "2026-07-10T10:00:00+00:00",
    "cancel_at_period_end": false,
    "canceled_at": null,
    "ended_at": null
  }
}
```

- `can_access_premium` — `is_subscribed || has_free_tier`. **This is the field the UI should gate on.**
- `is_subscribed` — true if there is an active paid subscription on any platform.
- `subscription.provider` — `"stripe"` (web) or `"revenuecat"` (mobile). Use it to
  route "Manage subscription": `revenuecat` → deep-link to the App Store / Play
  Store subscription settings; `stripe` → the web portal (the store cannot manage a
  Stripe sub and vice versa). `subscription` is `null` when the user has no active
  paid sub.
- `status` — `trialing | active | past_due | canceled` (and other Stripe-style values).
- `free_tier_expires_at` — ISO 8601, `profile.created_at + 7 days`, always returned.

### 1.2 `POST /api/v1/webhook/revenuecat/` (configured in RevenueCat, not called by the app)

RevenueCat POSTs purchase lifecycle events here. The app never calls this route.

- **Auth:** RevenueCat sends a fixed value in the `Authorization` header that you set
  in the dashboard; it must match the backend's configured secret. There is no HMAC
  signature.
- **Request body:** RevenueCat's standard `{ "api_version": "...", "event": { ... } }`
  envelope.
- Response `200`: `{ "received": true }` — event accepted (or safely ignored).
- Response `401`: the `Authorization` header is missing or wrong.

Behavior (black box): a successful purchase causes `GET /billing/status` for that
user to report `is_subscribed: true` with `provider: "revenuecat"` shortly after.
Renewals, cancellations, billing issues, and expirations update the same status.
Delivery is asynchronous (usually a second or two), and duplicate/retried events are
deduped — no action needed from the app.

---

## 2. RevenueCat dashboard setup

1. **Project & apps.** Create a RevenueCat project; add the App Store app (App Store
   Connect shared secret) and Play Store app (Play service account).
2. **Products → entitlement → offering.** Create the subscription products in App
   Store Connect / Play Console, import them into RevenueCat, attach them to a single
   entitlement (e.g. `premium`), and expose them in a default offering. Keep pricing
   roughly at parity with the Stripe web price (note Apple/Google take 15–30%).
3. **Webhook.** Settings → Integrations → Webhooks:
   - **URL:** `https://<your-api-host>/api/v1/webhook/revenuecat/`
   - **Authorization header:** a strong random secret, equal to the backend env var
     (see §4). The backend rejects mismatches with `401`.
   - **Environment:** enable Sandbox and Production while testing.
4. **App User ID.** The app must identify users with `appUserID = supabase user.id`
   after login (see §3). Do not use anonymous ids.

---

## 3. Mobile app usage

Login is required before purchase, so the RevenueCat identity always equals the
Supabase user id.

```ts
import Purchases from 'react-native-purchases';

// Configure once with the platform API key.
Purchases.configure({ apiKey: RC_PUBLIC_SDK_KEY });

// Identify on login (and on app start if already signed in).
await Purchases.logIn(supabaseUser.id);
// On logout:
await Purchases.logOut();

// Paywall: fetch offerings and purchase.
const offerings = await Purchases.getOfferings();
const pkg = offerings.current?.availablePackages[0];
await Purchases.purchasePackage(pkg);

// Gate on the backend status (authoritative, cross-platform).
const status = await api.get('/api/v1/billing/status');
if (!status.data.can_access_premium) showPaywall();
```

After a purchase, the store → RevenueCat → backend round-trip is asynchronous. Poll
`GET /billing/status` for a few seconds until `is_subscribed` flips, or rely on the
SDK's `customerInfo` entitlement for the immediate unlock.

Premium backend endpoints return **HTTP 402** when the user is not entitled — handle
402 as a fallback exactly like the web app does, since status can go stale mid-session.

---

## 4. Environment & configuration

The backend reads one env var for this integration (selected by the `DEV` flag, same
pattern as the Stripe vars):

- `SANDBOX_REVENUECAT_WEBHOOK_AUTH_TOKEN` (when `DEV=TRUE`)
- `LIVE_REVENUECAT_WEBHOOK_AUTH_TOKEN` (production)

This value must equal the dashboard webhook's Authorization header. If unset, the
webhook fails closed (rejects every event). The mobile app needs **no** backend
billing secrets — only its RevenueCat public SDK key.

---

## 5. Double subscriptions — what the routes guarantee

The two providers don't know about each other, so a user could in theory pay on both.
What the routes enforce:

- **Web checkout is cross-provider.** `POST /api/v1/billing/checkout-session/` returns
  **409** if the user already has an active subscription on **either** platform. So a
  web sub can't be stacked on top of a mobile one (or vice-versa on the web side).
- **Mobile purchases can't be blocked server-side.** The App Store / Play Store owns
  the transaction; the backend only learns of it via webhook afterward. Mitigate in
  the app: before showing the paywall, call `GET /billing/status` and, if
  `is_subscribed`, show "manage subscription" instead.

A double sub never breaks access (entitlement = any active sub); it is only a
double-charge concern, resolved via refund.
```

