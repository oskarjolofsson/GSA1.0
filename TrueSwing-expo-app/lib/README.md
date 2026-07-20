# `lib/` — the backend API boundary

Every call to the TrueSwing backend flows through one path. Do not call `fetch`
directly from hooks/components, and do not hand-write `/api/v1/...` strings in
feature code.

```
component / hook
      │
      ▼
features/<name>/services/*.ts     wraps the client, one file per domain entity
      │
      ├─ path  ─────────────►  lib/api/routes.ts     the only home for /api/v1 URLs
      ├─ types ─────────────►  lib/api/types.ts  ->  lib/api/schema.d.ts (generated)
      ▼
lib/apiClient.ts                  fetchWithAuth: token injection, ApiError, 402 backstop
      │
      ▼
   backend  (EXPO_PUBLIC_API_URL)
```

## Files

- **`apiClient.ts`** — `apiClient.get/post/patch/put/delete`. Pulls the Supabase
  access token, attaches `Authorization: Bearer …`, throws a typed `ApiError`
  (`errors.ts`) on failure, and routes 402s to the billing paywall backstop.
- **`api/routes.ts`** — the single typed home for every `/api/v1/...` path.
  Services build URLs from here (`routes.issues.byId(id)`), never string literals.
- **`api/schema.d.ts`** — **generated**, do not hand-edit. `openapi-typescript`
  output from the backend's `/openapi.json`.
- **`api/types.ts`** — `Schemas` convenience handle onto `schema.d.ts`.
- **`api/contract-assertions.ts`** — compile-time drift tripwire (no runtime,
  no Jest); fails `tsc` when an overridden/hand-written type drifts from the schema.
- **`supabase.ts`**, **`applyGlobalFont.ts`** — Supabase client and the global
  font patch.

## Types come from the backend schema

Feature response/request types are **derived**, not hand-written:

```ts
// features/analysis/types.ts
import type { Schemas } from 'lib/api/types';
export type Analysis = Schemas['GetAnalysis'];
```

A backend field rename/removal then surfaces as a **TypeScript error at the
consumer** on the next `npm run typecheck`.

### Regenerating after a backend change (manual)

There is no watcher. Editing a backend route does nothing to `schema.d.ts`. With
the backend running locally:

```bash
npm run gen:api-types     # hits http://localhost:8000/openapi.json -> lib/api/schema.d.ts
npm run typecheck         # a changed field now surfaces as a type error
```

Override the target with `TS_API_URL=… npm run gen:api-types`. It defaults to
`localhost:8000`, **not** `EXPO_PUBLIC_API_URL` (that points at the deployed
backend — you don't want to generate against prod).

### Endpoints with no `response_model` → hand-written

`GET /billing/status` and `GET /analyses/{id}/video-url/` return `{}` in the
OpenAPI schema, so `BillingStatus`, `SubscriptionSummary`, and `VideoUrlResponse`
can't be derived and stay hand-written. The input-only `Prompt` and
`AnalysisStatusResponse` are also hand-written. Add a `response_model` on the
backend to make any of these derivable later.
