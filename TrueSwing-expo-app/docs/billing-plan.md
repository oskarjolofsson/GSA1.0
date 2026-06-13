# Paywall Implementation Plan — Expo App (RevenueCat)

Mirrors the web frontend (`frontend/docs/billing.md`) for product parity, but
adapts to this app's reality: billing is **RevenueCat** (App Store / Play
Store), and there is **no route layer** to gate — premium features are a tab
(`upload`) and an in-flow screen (`drills`, inside `PracticeFlow`).

Source of truth stays the backend: `GET /api/v1/billing/status` →
`can_access_premium`. The app sells through the RevenueCat SDK, never a backend
checkout route.

## Premium surface (from `docs/billing/paywall.md`)
- 🔒 Upload a swing → `(tabs)/upload.tsx` → `UploadFlow`
- 🔒 Drills (recommended list) → inside `PracticeFlow` (reached from `homeFlow`)
- 🔒 Drill results → inside `PracticeFlow`
- ✅ Free: analysis home, past analyses, issues, profile/subscription mgmt

---

## Architecture

```
                       ┌─────────────────────────────────────┐
   login (AuthProvider) │  Purchases.logIn(user.id)           │
   logout               │  Purchases.logOut()                 │
                       └─────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼──────────────────────────────┐
        ▼                             ▼                              ▼
  BillingProvider              RevenueCat SDK               apiClient (lib)
  (mounted in (app)/_layout)   getOfferings / purchase      registerPayment-
  - status: BillingStatus      customerInfo (instant)       RequiredHandler()
  - refresh()/invalidate()                                   fired on ApiError 402
  - openPaywall(reason)                                         │
  - renders <PaywallModal>  ◄──── 402 backstop ─────────────────┘
        │
        ├── useRequirePremium()  ─── entry gate ──► upload tab focus, drills tap
        ├── <SubscriptionBanner> ─── home + profile (trial countdown / ended)
        └── <SubscriptionCard>   ─── profile (manage → store deep-link)
```

### Enforcement layers (web parity)
1. **Entry-point gate** — `useRequirePremium()` checks `status.can_access_premium`
   when the user opens the upload tab (`useFocusEffect`) and when they tap into
   drills inside `PracticeFlow`. If blocked: `openPaywall('gate')` and bounce
   back to analysis home. Replaces web's route-level `PremiumGate`, which has no
   equivalent here.
2. **402 interceptor (universal backstop)** — `fetchWithAuth` fires a registered
   handler on `ApiError(402)` (skip `/billing/` URLs to avoid loops),
   `invalidate()`s status, and `openPaywall('402')`. Catches everything the
   entry gate misses, including mid-session staleness.

> Both are UX only. Real enforcement is the backend 402. A feature is premium
> only once the backend treats it as premium.

---

## Files (full-parity scope)

`features/billing/` (per `features/CLAUDE.md` convention, capitalized files):

| File | Role |
|------|------|
| `BillingContext.tsx` | `BillingProvider`, status fetch/cache, paywall modal owner, `useBilling()` |
| `types.ts` | `BillingStatus`, `SubscriptionSummary`, `PaywallReason` (port web `types.ts` verbatim — same backend contract) |
| `services/billingService.ts` | `getBillingStatus()` → `apiClient.get('/api/v1/billing/status')` |
| `services/purchaseService.ts` | RevenueCat SDK wrapper: `configure`, `getOfferings`, `purchasePackage`, `currentEntitlement` |
| `utils/Trial.ts` | `daysLeft(free_tier_expires_at)` |
| `hooks/useRequirePremium.ts` | entry-point gate hook |
| `components/PaywallModal.tsx` | RN modal/sheet; headline by `PaywallReason`; Subscribe → `purchasePackage` |
| `components/SubscriptionBanner.tsx` | trial days-left / trial-ended banner |
| `components/SubscriptionCard.tsx` | manage subscription → store deep-link (provider-aware) |

Touched existing files:
- `lib/apiClient.ts` — add `registerPaymentRequiredHandler` + fire on 402.
- `features/auth/AuthProvider.tsx` — `Purchases.logIn(user.id)` on session, `logOut()` on sign-out.
- `app/(app)/_layout.tsx` — wrap authenticated `Stack` in `<BillingProvider>`.
- `app/(app)/(tabs)/upload.tsx` + `PracticeFlow` — call `useRequirePremium()`.
- Profile screen — render `SubscriptionBanner` + `SubscriptionCard`.
- `app.json` — `react-native-purchases` config plugin; new env `EXPO_PUBLIC_RC_IOS_KEY` / `EXPO_PUBLIC_RC_ANDROID_KEY`.

---

## Key decisions (baked in; flag if you disagree)

1. **Provider scope.** Mount `BillingProvider` in `app/(app)/_layout.tsx` (whole
   authed subtree) rather than per-feature. Simpler than web's selective
   `BillingShell` because every authed screen may hit a 402, and the modal must
   be globally reachable. Public/sign-in routes stay outside it.
2. **Instant unlock after purchase.** Use the SDK's `customerInfo` entitlement
   for the immediate UI unlock, then poll `GET /billing/status` for a few seconds
   until `is_subscribed` flips (store→RC→backend is async, ~1–2s). Backend stays
   authoritative; SDK is the optimistic layer. (Matches integration doc §3.)
3. **Manage subscription is provider-aware.** `subscription.provider === 'revenuecat'`
   → deep-link to the native store subscription settings (iOS:
   `itms-apps://apps.apple.com/account/subscriptions`, Android: Play subscriptions
   URL). `'stripe'` → open the web portal in a browser. A user who bought on web
   cannot manage in-app and vice versa.
4. **Double-sub mitigation.** Before showing the paywall, if `is_subscribed`,
   show "Manage subscription" instead of "Subscribe" (mobile purchases can't be
   blocked server-side — integration doc §5).
5. **Native module = prebuild.** `react-native-purchases` is native → run
   `expo prebuild` + `expo run:ios`/`run:android` after install; Expo Go won't
   work (already on dev-client).

---

## Edge cases to cover
- Status stale → 402 mid-session pops paywall (covered by interceptor).
- Purchase succeeds but webhook lag → instant unlock via `customerInfo`, poll reconciles.
- User cancels purchase sheet → no state change, modal stays.
- Restore purchases (new device / reinstall) → `Purchases.restorePurchases()` action in `SubscriptionCard`.
- Sign out → `Purchases.logOut()` so the next user doesn't inherit entitlements.
- `getBillingStatus` throws "Not signed in" → set `status=null`, no error surfaced (web parity).
- Offline / offerings fetch fails → paywall shows retry, not a crash.

## Test coverage
**This PR adds `jest-expo`** (no runner exists today). Setup:
- `jest-expo` preset + `@testing-library/react-native`; `npm test` script.
- Mock `react-native-purchases` (jest manual mock) so no native bridge is hit.
- Mock `apiClient`/Supabase session for `billingService` tests.

Required suites (billing is high-blast-radius — ship it tested):
- `Trial.daysLeft` (boundaries: 0, expired, future).
- `useBilling` reducer: refresh dedupe, `invalidate`, paywall open/close.
- 402 handler: fires once, ignores `/billing/` URLs, no loop.
- `useRequirePremium`: blocks when `!can_access_premium`, allows when true/trial.
- Provider-aware manage-subscription routing (revenuecat vs stripe branch).
- `purchaseService`: cancelled purchase = no state change; restore flow.

---

## Resolved decisions
- **A) Trial start** — backend-owned (`created_at + 7d`); app only displays it. No app-side trial init.
- **B) Test runner** — RESOLVED: add `jest-expo` in this PR; ship billing tested (see Test coverage).
- **C) RC SDK keys** — RESOLVED: `EXPO_PUBLIC_RC_IOS_KEY` / `EXPO_PUBLIC_RC_ANDROID_KEY` in `.env` (user adds the keys). Code reads `process.env.EXPO_PUBLIC_RC_*`.
- **Native build** — RESOLVED: `expo prebuild` + regenerated `ios/`/`android/` is expected and fine.

## Implementation notes (deviations from plan)

- **Env var names:** `EXPO_PUBLIC_RC_APPLE_KEY` (iOS) / `EXPO_PUBLIC_RC_GOOGLE_KEY`
  (Android), matching what's already in `.env`.
- **Banner placement:** the app's home (analysis) screen is a full-bleed,
  height-sized swipe reel (`AnalysisResultScreen` FlatList), not a dashboard — a
  banner there breaks the immersive layout. `SubscriptionBanner` is rendered on
  **profile only**, not home. This diverges from the web "dashboard home + profile".
- **Drills gate point:** drills aren't a route; the gate fires in `homeFlow`'s
  `onNext` (the transition that starts a practice session), covering drill
  practice + results in one place.
- **tsconfig fixes (pre-existing breakage):** `ignoreDeprecations: "6.0"` was
  invalid for TS 5.9 and broke `tsc` entirely; corrected to `"5.0"`. Added
  `"jest"` to `types` so test files typecheck.

## GSTACK REVIEW REPORT

| Run | Status | Findings |
|-----|--------|----------|
| Step 0 scope challenge | done | 8-file smell flagged; justified by full-parity decision. RevenueCat = Layer 1, no innovation token spent. |
| Architecture review | done | Route-gate mismatch resolved via entry-point gate + 402 backstop (user-confirmed). 402 maps cleanly onto existing `ApiError`. Provider mounted at authed-subtree root. |
| Code quality | done | Reuse maximized: existing `apiClient`/`ApiError`/`AuthProvider` extended, not duplicated. `types.ts` ported verbatim from web (DRY across platforms). |
| Tests | done | `jest-expo` added in this PR with named suites and a `react-native-purchases` mock. Billing ships tested. |
| Performance | done | Status cached with staleness window (port web `STALE_MS` 45s); refresh on focus + invalidate. Purchase round-trip handled optimistically via SDK `customerInfo`. No hot-path concerns. |

VERDICT: PLAN READY — all decisions resolved.

NO UNRESOLVED DECISIONS
