# TrueSwing Admin

Next.js (App Router) admin dashboard for the TrueSwing backend.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run test     # vitest
npm run build    # production build + typecheck
```

Environment: set `NEXT_PUBLIC_API_URL` to the TrueSwing backend (default
`http://localhost:8000`), plus the Supabase vars in `.env`.

## Architecture

Thin `app/` routing over feature modules and a server-side data layer:

- `app/` — layouts, route groups, one-line page re-exports, the OAuth callback.
- `features/<name>/` — UI (`pages/`, `components/`, `hooks/`) + server `actions.ts`.
- `lib/<domain>/` — server-side API access, auth, Supabase. See `lib/README.md`.
- `components/` — cross-feature UI.

## TrueSwing API types (generated)

The types the admin uses for API responses come in two flavors:

- **Generated** — `lib/api/schema.d.ts` is produced by `openapi-typescript` from
  the backend's `/openapi.json`. `lib/subscriptions/types.ts` aliases straight
  out of it, so a backend field rename/removal shows up as a TypeScript error at
  the consumer.
- **Hand-written** — `lib/users/types.ts`, because the `/users/all/` endpoint has
  no `response_model` on the backend and so isn't in the schema.

### Regenerating after a backend change

This is **not automatic.** Editing a FastAPI route does nothing to
`schema.d.ts` — there is no watcher. After you change an admin-facing endpoint's
request/response shape, with the backend running:

```bash
npm run gen:api-types     # hits ${NEXT_PUBLIC_API_URL}/openapi.json → lib/api/schema.d.ts
npm run build             # a changed field now surfaces as a type error
```

`schema.d.ts` is committed and marked "do not edit by hand" — regenerate it,
never hand-edit it (a manual change is blown away on the next run).

> Editing the backend? See `backend/docs/howToUseAPI/README.md` for the same
> reminder from the other side.

## Testing

`npm run test` runs vitest. The data layer (`lib/`) is unit-tested against
mocked `fetch`/Supabase; pure helpers (pagination, formatting, route-guard) have
their own tests.
