# Stripe Billing — Frontend Integration Guide

This document describes how the frontend should integrate with the billing endpoints exposed by the backend. The backend owns all Stripe API calls, webhook handling, and subscription state. The frontend's job is to:

1. Read the user's entitlement state and gate UI accordingly.
2. Send the user to Stripe Checkout to start a subscription.
3. Send subscribed users to the Stripe Customer Portal to manage their subscription.
4. Handle the success and cancel redirect routes.

The frontend **never** talks to Stripe directly and **never** handles webhooks.

---

## 1. Endpoints

All billing endpoints are mounted under `/api/v1/billing` and require a valid auth token (the same bearer token used elsewhere in the app — `get_current_user` dependency).

| Method | Path                                  | Purpose                                                 |
|--------|---------------------------------------|---------------------------------------------------------|
| POST   | `/api/v1/billing/checkout-session/`   | Create a Stripe Checkout session for a new subscription |
| GET    | `/api/v1/billing/portal/`             | Create a Stripe Customer Portal session                 |
| GET    | `/api/v1/billing/status`              | Read the user's entitlement state                       |

The Stripe webhook (`POST /api/v1/webhook/stripe/`) is called by Stripe directly — **do not** call it from the frontend.

### 1.1 `POST /api/v1/billing/checkout-session/`

Starts a new subscription flow. Requires the user to be authenticated and **not** already subscribed.

Request: no body required.

Response `200`:
```json
{ "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_..." }
```

Behavior: redirect the browser to `checkout_url`. After payment, Stripe will redirect to:

- Success: `${FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`
- Cancel:  `${FRONTEND_URL}/pricing`

Errors:
- `404` — user profile not found.
- `409` — user already has an active subscription. Send them to the portal instead.
- `400` — Stripe price is not configured on the backend (env misconfig).

### 1.2 `GET /api/v1/billing/portal/`

Creates a Stripe-hosted Customer Portal session, where the user can update payment method, cancel, view invoices, etc.

Response `200`:
```json
{ "portal_url": "https://billing.stripe.com/p/session/..." }
```

Behavior: redirect the browser to `portal_url`. After the user is done, Stripe redirects back to `${FRONTEND_URL}/dashboard/settings`.

Errors:
- `404` — user has no billing customer record yet (i.e. they have never checked out). Show the Checkout button instead.

### 1.3 `GET /api/v1/billing/status`

Returns the user's current entitlement state. Use this to gate UI.

Response `200`:
```json
{
  "is_subscribed": false,
  "has_free_tier": true,
  "can_access_premium": true,
  "free_tier_expires_at": "2026-06-16T12:34:56+00:00"
}
```

- `is_subscribed` — true if the user has an active paid Stripe subscription.
- `has_free_tier` — true if the user's account is less than 7 days old. See [§3.1 Free tier](#31-free-tier-how-it-actually-works).
- `can_access_premium` — `is_subscribed || has_free_tier`. **This is the field the UI should gate on.**
- `free_tier_expires_at` — ISO 8601 timestamp = `profile.created_at + 7 days`. Always returned (even after expiry — frontend decides whether to render a countdown).

---

## 2. Recommended UX Flow

### 2.1 Pricing / Upgrade page

On `/pricing`:

1. Call `GET /api/v1/billing/status`.
2. If `is_subscribed` → show "Manage subscription" button → calls portal endpoint.
3. Else → show "Subscribe" button → calls checkout-session endpoint.

```ts
async function startCheckout() {
  const res = await api.post("/api/v1/billing/checkout-session/");
  window.location.href = res.data.checkout_url;
}

async function openPortal() {
  const res = await api.get("/api/v1/billing/portal/");
  window.location.href = res.data.portal_url;
}
```

### 2.2 Success page — `/billing/success`

The user lands here after a successful checkout. Stripe appends `?session_id=...` but the frontend does **not** need to do anything with it — the backend has already received the `checkout.session.completed` webhook by the time most users finish reading this page.

Suggested behavior:

1. Show a "Thanks, you're subscribed!" message.
2. Poll `GET /api/v1/billing/status` for a few seconds (e.g. every 1s for up to 10s) until `is_subscribed === true`. Webhooks are usually delivered within a second or two but it's not synchronous, so a short poll avoids a stale UI.
3. Once subscribed, redirect to the app.

### 2.3 Cancel page — `/pricing`

Stripe redirects here when the user backs out of Checkout. No backend state changes. Just render the pricing page normally.

### 2.4 Settings / Portal return — `/dashboard/settings`

When the user finishes in the Stripe Portal they land here. Re-fetch `GET /api/v1/billing/status` on mount so the UI reflects any cancellations or plan changes.

---

## 3. Gating Premium Features

### 3.1 Free tier — how it actually works

The "free tier" is **not** a Stripe trial and is **not** a stored flag. It is a pure derived check on the backend:

```python
# core/services/payment/entitlement_service.py
def has_free_tier(user_id, db):
    return profile.created_at >= now() - timedelta(days=7)
```

Implications:

- The trial clock starts at **account signup** (`profile.created_at`), not at first login, first premium use, or any explicit "start trial" action.
- It is rolling and recomputed on every request. Nothing is written, no job runs, no email is sent. At the 7-day mark the value just flips from `True` to `False` and the next premium request starts returning `402`.
- A user can go from entitled to locked out between two requests with no backend-side warning surface. If you want to show "your free trial ends in X days", the frontend has to compute it from `profile.created_at` (currently not returned by `/billing/status` — fetch it from the user/profile endpoint, or extend `/billing/status` to include `free_tier_expires_at`).
- There is no grace period. A subscription is the only way to extend access past day 7.



The backend already enforces premium gating on protected routes (e.g. `practice` and `analysis` endpoints) via a `require_premium` dependency. If a non-entitled user calls these, they will get a `402 Payment Required` (or equivalent — check `app/exception_handlers.py`).

The frontend should mirror this for UX:

```ts
const { data: status } = useBillingStatus(); // GET /api/v1/billing/status, cached
if (!status.can_access_premium) {
  return <UpgradePrompt />;
}
return <PremiumFeature />;
```

**Always** also handle the `402` response from premium endpoints as a fallback — the status can go stale (e.g. subscription canceled mid-session).

### Suggested caching

- Cache `/billing/status` for ~30–60 seconds on the client (React Query `staleTime`).
- Invalidate on: app mount, return from `/billing/success`, return from `/dashboard/settings`, and on any `402` response from a premium endpoint.

---

## 4. Required Frontend Routes

The backend hardcodes these redirect targets via `FRONTEND_URL` (see `core/config.py`). Make sure they exist:

| Route                  | Used for                          |
|------------------------|-----------------------------------|
| `/billing/success`     | Stripe checkout success           |
| `/pricing`             | Stripe checkout cancel + upsell   |
| `/dashboard/settings`  | Stripe portal return              |

If you need to change any of these, update the URLs in `core/infrastructure/payment/stripe/gateway.py` to match.

---

## 5. Environment & Configuration

The backend reads these env vars (see `core/config.py`):

- `STRIPE_SECRET_KEY` — backend-only.
- `STRIPE_WEBHOOK_SECRET` — backend-only.
- `PRICE_ID` — the Stripe Price ID for the subscription plan.
- `FRONTEND_URL` — base URL used for the redirect URLs above.

The frontend needs **no** Stripe keys. Do not put `STRIPE_PUBLISHABLE_KEY` or similar in the frontend — Checkout and Portal are both hosted by Stripe, so a publishable key is not needed for this integration.

---

## 6. Webhook (FYI, not called from frontend)

Stripe POSTs to `/api/v1/webhook/stripe/` with `Stripe-Signature` header. The backend handles:

- `checkout.session.completed` — links the Stripe customer to the user.
- `customer.subscription.created` / `updated` / `deleted` — upserts subscription state.

Events are idempotent (deduped via `processed_webhook_events`). Make sure the Stripe Dashboard webhook endpoint is configured to point at `${BACKEND_URL}/api/v1/webhook/stripe/` and that the signing secret matches `STRIPE_WEBHOOK_SECRET`.

---

## 7. Quick Reference — Minimal Frontend Wiring

```ts
// src/lib/billing.ts
export async function getBillingStatus() {
  const { data } = await api.get("/api/v1/billing/status");
  return data as {
    is_subscribed: boolean;
    has_free_tier: boolean;
    can_access_premium: boolean;
  };
}

export async function startCheckout() {
  const { data } = await api.post("/api/v1/billing/checkout-session/");
  window.location.href = data.checkout_url;
}

export async function openCustomerPortal() {
  const { data } = await api.get("/api/v1/billing/portal/");
  window.location.href = data.portal_url;
}
```

That's the entire surface area.
