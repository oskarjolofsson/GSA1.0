# Admin pages read the admin verdict off the data endpoint, not a separate verify call

Almost every endpoint the admin app hits is `require_admin` on the backend, so its status
already answers "is this an admin?". Pages therefore fetch their data directly and map the
response — 403 to `denied`, anything else that failed to `error` — instead of calling
`GET /admin/verify/` first. `verifyAdmin` runs once, at sign-in (`app/page.tsx`), to decide
whether to show the dashboard at all.

The alternative, a verify call per page, costs a round trip on every navigation to re-derive
something the next request is about to tell us anyway.

## Consequences

`denied` and `error` must never be collapsed. One is a permission state ("no access"), the
other an outage ("try again"); merging them would report an API outage as a revoked account.

Server Actions are reachable by direct POST, but the same `require_admin` gate covers them,
so they only need a session token. The exception is `lib/auth/with-admin.ts`, used where the
backend route is only `get_current_user` — the users feature. There the backend still refuses
cross-user writes, so `withAdmin` is defence in depth and the source of a better message, not
the sole gate.
