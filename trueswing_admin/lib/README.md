# lib/

Server-side logic. No React, no JSX, no routing. Everything here runs on the
server and knows nothing about how a page renders it.

## What lives here

- **`api/`** — the TrueSwing API client primitives.
  - `authed-fetch.ts` — attaches the Bearer token + `cache: "no-store"`, swallows
    network errors into `null`. The one place that talks to `fetch`.
  - `routes.ts` — every admin API path, in one map. Add new endpoints here, never
    as an inline string literal in a request function.
  - `result.ts` — the typed outcome shapes both reads and writes return:
    - `FetchResult<T>` (`ok` / `denied` / `error`) via `toResult` — for GETs.
    - `MutationResult` (`ok` / `conflict` / `notFound` / …) via `toMutationResult`
      — for POST/DELETE/PATCH. Statuses map 1:1 to the backend exception handlers
      (`backend/app/exception_handlers.py`), each carrying `{ detail }`.
- **`auth/`** — `require-session` (token or redirect/null), `with-admin` (gate a
  Server Action on admin), `verify-admin`, and the pure `route-guard` decision.
- **`supabase/`** — the SSR client factories (server / client / middleware).
- **`<domain>/`** (e.g. `users/`, `subscriptions/`) — one file per endpoint. Each
  takes a `token`, calls `authedFetch(routes.x(), …)`, and returns a
  `FetchResult` / `MutationResult`. Plus that domain's request/response `types.ts`.

## The lib ↔ features boundary

| Concern | Home |
|---------|------|
| Talking to the API, auth, tokens, server logic | `lib/<domain>/` |
| Request/response types mirrored from the backend | `lib/<domain>/types.ts` |
| UI (pages, components, hooks) | `features/<name>/` |
| Pure **view** helpers (formatting, pagination math, active-route tests) | `features/<name>/` or `features/shared/` |

Rule of thumb: if it takes a token or hits the network, it's `lib/`. If it shapes
data for display or decides how something looks, it's `features/`. `format.ts`,
`paginate.ts`, and `shared/utils/is-active.ts` are view helpers and correctly live
under `features/`, even though they sit near subscription data — they never call
the API.

## Types (see also #6)

The backend serves `/openapi.json`. `npm run gen:api-types` regenerates the
committed `lib/api/schema.d.ts` (targets `NEXT_PUBLIC_API_URL`, default
`http://localhost:8000`). Rerun it whenever the API contract changes.

- `subscriptions/types.ts` — **derived**: aliases `components["schemas"][...]`,
  so a backend field rename/removal surfaces as a type error at the consumer.
- `users/types.ts` — **still hand-written**: the `/users/all/` endpoint has no
  `response_model`, so its shape isn't in `/openapi.json`. Give that endpoint a
  `response_model` on the backend to make it generatable too.
