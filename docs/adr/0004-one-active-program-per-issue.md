# One active program per issue, and asking again returns it

`program_service.generate_program` is reached from two entry points: the AI path passes
`analysis_issue_id` (a fault diagnosed from a swing video) and the coach/browse path
passes `issue_id` (something picked out of the library). They used to be separate
functions that disagreed about what a duplicate means — the AI one returned the
existing program, the browse one raised 409 — so the same user action succeeded or
failed depending on which screen it started from.

One rule now: asking for a program you already have returns it. That is what both
callers want, and it matches the partial unique index `programs_one_active_per_issue`,
which makes "one active program per issue" a fact of the schema rather than a
convention.

## Consequences

Idempotency is keyed on the issue, not the analysis issue. Two analyses can diagnose
the same fault, and the index does not care which one sent you.
