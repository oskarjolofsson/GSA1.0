# Backend API — How To Use

Consumer-facing guides for every group of endpoints the True Swing backend exposes.
Each guide treats the backend as a black box: what the routes are for, how to call
them, and what they give back. Internal implementation (services, repositories, DB)
is out of scope here.

All endpoints are mounted under `/api/v1`.

## Guides

| Group | Prefix | What it's for |
|-------|--------|---------------|
| [Analyses](./analyses.md) | `/api/v1/analyses` | Upload a swing video and run AI analysis; list/read/delete results |
| [Issues](./issues.md) | `/api/v1/issues` | Swing faults detected in an analysis; the user's issue library |
| [Drills](./drills.md) | `/api/v1/drills` | Practice drills that fix issues |
| [Practice sessions](./practice-sessions.md) | `/api/v1/practice` | Track practice sessions and per-drill reps |
| [Programs](./programs.md) | `/api/v1/programs` | Adaptive practice plans that schedule the next session per issue |
| [Issue–drill mappings](./issue-drills.md) | `/api/v1/issue-drills` | Admin links between issues and drills |
| [Feedback](./feedback.md) | `/api/v1/feedback` | User-submitted app feedback |
| [Users](./users.md) | `/api/v1/users` | Account listing (admin) and account deletion |
| [Admin](./admin.md) | `/api/v1/admin` | Admin dashboard stats and admin check |
| [Payment — Stripe (web)](./payment/stripe-frontend-integration.md) | `/api/v1/billing` | Web subscriptions via Stripe |
| [Payment — RevenueCat (mobile)](./payment/revenuecat-integration.md) | `/api/v1/billing`, `/api/v1/webhook/revenuecat` | Mobile subscriptions via App Store / Play Store |

## Authentication & access levels

Every endpoint (except provider webhooks) requires the Supabase **bearer token** in
the `Authorization` header:

```
Authorization: Bearer <supabase access_token>
```

Each route is marked with one of three access levels:

| Mark | Meaning | Failure |
|------|---------|---------|
| 🔓 **User** | Any authenticated user | `401` if the token is missing/invalid |
| ⭐ **Premium** | Authenticated **and** entitled (active subscription or free tier) | `402 Payment Required` |
| 🛡 **Admin** | Authenticated **and** an admin account | `403 Forbidden` |

"Premium" entitlement is the same `can_access_premium` surfaced by
`GET /api/v1/billing/status` — see the payment guides.

## Common error responses

| Status | Meaning |
|--------|---------|
| `401` | Missing or invalid auth token |
| `402` | Premium feature, user not entitled |
| `403` | Admin-only route, user is not an admin |
| `404` | Resource not found (or not owned by the user) |
| `409` | Conflict (e.g. already subscribed) |
| `422` | Request body failed validation |

Error bodies are `{ "detail": "<message>" }`.

## Downstream consumers — regenerate types after changing admin endpoints

The **admin dashboard** (`trueswing_admin/`) generates its TypeScript types from
this backend's `/openapi.json`. That generation is **manual** — changing a route
here does not update the dashboard's types on its own.

After you change the request/response shape of an admin-facing endpoint (anything
under `/api/v1/admin`, `/api/v1/users`, or the subscription routes), regenerate
the dashboard types so a renamed/removed field surfaces as a compile error there
instead of a runtime surprise. With this backend running:

```bash
cd trueswing_admin && npm run gen:api-types
```

Tip: giving an endpoint an explicit `response_model` puts its shape in
`/openapi.json`, which lets the dashboard derive its type instead of
hand-mirroring it. `/api/v1/users/all/` currently lacks one, which is why the
dashboard still hand-writes its `User` type.
