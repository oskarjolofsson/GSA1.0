# Billing & Paywall — Frontend Implementation

Technical reference for how the paywall is implemented in the web frontend.

All code lives under `src/features/billing/`, with a shared 402 interceptor in
`src/lib/apiClient.ts` and route wiring in `src/app/router.jsx`.

```
src/features/billing/
├── BillingContext.tsx          # provider, status fetching, paywall control
├── types.ts                    # BillingStatus, SubscriptionSummary, PaywallReason
├── services/billing.ts         # API calls (status, checkout, portal)
├── utils/trial.ts              # daysLeft()
├── components/
│   ├── PremiumGate.tsx         # route-level gate
│   ├── PaywallModal.tsx        # upgrade modal
│   ├── SubscriptionBanner.tsx  # trial / expired banner
│   └── SubscriptionCard.tsx    # manage subscription
└── screens/
    ├── PricingPage.tsx
    └── BillingSuccess.tsx
```

---

## 1. Data model (`types.ts`)

The frontend's entire notion of access comes from one backend call,
`GET /api/v1/billing/status`:

```ts
type BillingStatus = {
  is_subscribed: boolean;        // has an active paid subscription
  has_free_tier: boolean;        // still inside the free trial window
  can_access_premium: boolean;   // THE authoritative gate flag
  free_tier_expires_at: string;  // ISO timestamp
  subscription: SubscriptionSummary | null;
};

type SubscriptionSummary = {
  provider: 'stripe' | 'revenuecat'; // who manages the sub
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  ended_at: string | null;
};

type PaywallReason = 'manual' | 'gate' | '402';
```

- **`can_access_premium` is the single source of truth.** The UI never recomputes
  access by OR-ing `is_subscribed` and `has_free_tier`; it trusts this flag. The
  other fields are display-only (trial countdown, subscription card state).
- **`provider`** distinguishes a web-managed subscription from one purchased in a
  mobile app store. The latter cannot be managed from the web portal — the UI must
  direct the user to manage it in the app instead.

---

## 2. State container — `BillingContext.tsx`

`BillingProvider` fetches and holds `BillingStatus` and owns the paywall modal.

**`useBilling()` exposes:**

| Field          | Purpose                                                       |
| -------------- | ------------------------------------------------------------- |
| `status`       | current `BillingStatus | null`                                |
| `loading`      | fetch in flight                                               |
| `error`        | last non-auth error                                           |
| `refresh()`    | fetch status; dedupes concurrent calls via an `inflight` ref  |
| `invalidate()` | reset staleness timer and force a refresh                     |
| `openPaywall(reason)` / `closePaywall()` | control the modal                 |

**Refresh triggers:**

- On mount.
- On `window` focus, but only if the cached status is older than `STALE_MS`
  (45s).
- On `invalidate()` — e.g. `SubscriptionCard` calls it on mount because the user
  is redirected back to it after managing billing, so cancellations/plan changes
  must be picked up.

**Error handling:** if the status call throws `"Not signed in"`, `status` is set
to `null` (no error surfaced). Any other error populates `error`.

The provider renders `<PaywallModal>` itself, so the modal is globally available
within the provider — individual screens never mount it.

**Scope:** mounted via `BillingShell` (`router.jsx`) only around the `/pricing`,
`/billing/success`, and `/dashboard/*` subtrees. It is **not** global and is
**not** present on `/admin` or public pages.

---

## 3. Two enforcement layers

### Layer 1 — Route gate (`PremiumGate.tsx`)

Wraps a route element:

- While `loading` or `status === null` → renders nothing (parent layout shows the
  shell).
- If `status && !can_access_premium` → calls `openPaywall('gate')` and
  `<Navigate to="/dashboard/app" replace />`.
- Otherwise renders `children`.

### Layer 2 — Global 402 interceptor (`lib/apiClient.ts`)

`fetchWithAuth` invokes a registered handler on any `402 Payment Required`
response. `BillingProvider` registers it (`registerPaymentRequiredHandler`) to:

1. **Ignore** 402s from `/billing/` URLs (prevents loops on billing calls).
2. `invalidate()` the status.
3. Open the paywall with `reason: '402'`.

This is the backstop: any premium request that reaches the backend and gets a 402
pops the paywall even on routes that aren't wrapped in `PremiumGate`. This is why
several premium-ish routes are intentionally left ungated at the route level —
they rely on the backend to return 402.

> **Security note:** both layers are client-side UX. Real enforcement is the
> backend. A feature is only truly protected once the backend treats it as
> premium (returns 402). Front-end gating alone redirects/prompts but does not
> secure anything.

---

## 4. Route wiring (`src/app/router.jsx`)

Route-gating is applied to **only three routes**:

| Route                        | `PremiumGate`? |
| ---------------------------- | :------------: |
| `/dashboard/upload`          | ✅ yes         |
| `/dashboard/drills`          | ✅ yes         |
| `/dashboard/drills/results`  | ✅ yes         |
| `/dashboard/app` (home)      | ❌ no          |
| `/dashboard/analysis`        | ❌ no          |
| `/dashboard/issues`          | ❌ no          |
| `/dashboard/profile`         | ❌ no          |
| `/admin/*`                   | ❌ no (no `BillingProvider` at all) |

Structure: `RequireAuth` wraps the `/dashboard` subtree, then `BillingShell`
(`<BillingProvider>`) wraps the dashboard layout, and only specific child routes
add `<PremiumGate>`. `/pricing` and `/billing/success` also sit inside
`BillingShell`; the latter is additionally behind `RequireAuth`.

---

## 5. Paywall modal (`PaywallModal.tsx`)

Rendered by `BillingProvider`. Headline depends on `PaywallReason`:

| Reason     | Headline                      | Source                       |
| ---------- | ----------------------------- | ---------------------------- |
| `'manual'` | "Unlock premium"              | programmatic `openPaywall()` |
| `'gate'`   | "This is a premium feature"   | `PremiumGate`                |
| `'402'`    | "Your access has expired"     | 402 interceptor              |

Actions:

- **Subscribe** → `startCheckout()` → redirects the browser to the returned
  checkout URL.
- **Maybe later** / close → closes the modal and navigates to `/dashboard/app`.

---

## 6. Surrounding billing UI

- **`SubscriptionBanner`** (dashboard home + profile): renders nothing if
  `is_subscribed`. Otherwise shows trial days-left via `utils/trial.daysLeft`
  with an Upgrade link, or an "trial ended" banner.
- **`SubscriptionCard`** (profile): shows current subscription state and opens the
  billing management portal (`openCustomerPortal()`), falling back to checkout on
  a 404 (no customer record yet). Re-`invalidate()`s on mount since it's the
  return page after managing billing.
- **`PricingPage`** (`/pricing`): public pricing screen inside `BillingShell`.
- **`BillingSuccess`** (`/billing/success`): post-checkout landing, behind
  `RequireAuth` + `BillingShell`.

---

## 7. Service layer (`services/billing.ts`)

All calls go through `fetchWithAuth` (injects the auth bearer token):

| Function               | Request                                   | Effect                       |
| ---------------------- | ----------------------------------------- | ---------------------------- |
| `getBillingStatus()`   | `GET /api/v1/billing/status`              | returns `BillingStatus`      |
| `startCheckout()`      | `POST /api/v1/billing/checkout-session/`  | redirects to `checkout_url`  |
| `openCustomerPortal()` | `GET /api/v1/billing/portal/`             | redirects to `portal_url`    |

---

## Summary

- **Source of truth:** backend `can_access_premium` from `GET /billing/status`.
- **Two layers:** `PremiumGate` route redirect (upload + drills only) plus a
  global 402 interceptor everywhere inside `BillingProvider`.
- **Scope:** only `/dashboard`, `/pricing`, `/billing/success` have a
  `BillingProvider`; `/admin` and public pages do not.
- **Guarantee:** client-side UX only — real enforcement is server-side; the 402
  interceptor catches anything the route gates miss.
</content>
