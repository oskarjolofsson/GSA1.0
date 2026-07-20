# TrueSwing Admin

Next.js (App Router) admin dashboard for the TrueSwing backend.

## Prerequisites

- Node.js 20+
- A running TrueSwing backend (see [`../backend/README.md`](../backend/README.md))

## Setup

```bash
cd trueswing_admin
npm install
npm run dev
```

Runs on `http://localhost:3000`.

```bash
npm run test   # vitest
npm run build  # production build + typecheck
npm run lint   # eslint
```

## Environment variables

Create a `.env` in this directory:

```env
# TrueSwing API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Regenerating API types

`lib/api/schema.d.ts` is generated from the backend's `/openapi.json` and is
committed. It does not update itself — after changing an admin-facing endpoint's
request or response shape, with the backend running:

```bash
npm run gen:api-types
npm run build   # a changed field now surfaces as a type error
```

Never hand-edit `schema.d.ts`; the next run overwrites it.

## More docs

- [`lib/README.md`](lib/README.md) — architecture and the server-side data layer
- [`docs/HowToDeploy.md`](docs/HowToDeploy.md)
- [`CLAUDE.md`](CLAUDE.md) — project conventions
