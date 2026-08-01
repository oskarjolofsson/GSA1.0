# Backend tests

## Local or remote — pick deliberately

The suite can run against a throwaway local Supabase or against the real remote
database. **Local is the default you want.**

```bash
./scripts/test-local.sh                    # LOCAL  — everything, ~19s
./scripts/test-local.sh tests/api -q       # LOCAL  — one directory
./scripts/test-local.sh -k taxonomy -x     # LOCAL  — any pytest args pass through

.venv/bin/python -m pytest -q              # REMOTE — everything, ~436s
.venv/bin/python -m pytest tests/api -q    # REMOTE — one directory
```

|  | local | remote |
|---|---|---|
| full suite | **~19s** | ~436s |
| database | throwaway, rebuilt from `supabase/migrations/` | the real dev project |
| round trip | sub-millisecond | ~46ms to `aws-1-eu-west-1` |
| what CI runs | ✅ this | ✗ |

The 23x gap is entirely network latency. The suite issues roughly 10,000 statements,
so a remote run spends 96% of its wall time idle — measured at `real 438s` against
`user 14.9s + sys 2.8s` of actual CPU.

### How the switch works

There is no flag and no config. `load_dotenv(override=False)` means a real environment
variable beats `backend/.env`:

```
DATABASE_URL set in the environment?  →  use it              (local — the script exports it)
not set?                              →  fall back to .env   (REMOTE — the default)
```

So **bare `pytest` targets remote.** That matters beyond speed: per the AI-test section
below, anything writing outside the rolling-back session lands in the real database.

### The VSCode Testing UI targets local

It runs pytest directly rather than through the script, so it would inherit that same
fallback. `.vscode/settings.json` sets `python.envFile` to `backend/env.local-supabase`
to redirect it — otherwise the most convenient way to run tests would also be the
slowest and the one touching real data.

`env.local-supabase` is committed on purpose. It holds the Supabase CLI's fixed local
credentials: identical on every machine, publicly documented, and only valid against
`127.0.0.1`. It is deliberately not named `.env*`, which the root `.gitignore` swallows.
Real credentials stay in `backend/.env`, which is ignored.

It requires `supabase start`. Without it the Testing UI fails with connection refused —
the correct failure. To target remote deliberately, run pytest from a terminal.

### First-time local setup

```bash
# Docker must be running (Docker Desktop or colima)
cd backend
supabase start        # boots Postgres + GoTrue + PostgREST. First run pulls images.
```

`config.toml` disables `realtime`, `studio`, `inbucket`, `storage`, `edge_runtime` and
`analytics` to keep the boot fast. `auth` and `api` are **not** optional: `conftest.py`
creates real GoTrue users, and `tests/integration/test_content_rls.py` deliberately
probes PostgREST with the anon key.

Leave the stack running. You only need it again after changing migrations:

```bash
supabase db reset     # drop, recreate, replay every migration in supabase/migrations/
```

Nothing is fetched from the remote project — `db reset` replays the local `.sql` files
against an empty container. That also makes it a migration test: if the chain cannot
build a database from scratch, this is where you find out.

## Live-AI tests are opt-in

Everything under `tests/integration/AI/` is **skipped by default**:

```bash
pytest                                  # AI tests skipped, reported as skipped
pytest --run-ai                          # everything, including AI
pytest --run-ai tests/integration/AI     # only the AI tests
pytest -rs                               # show why anything was skipped
```

Two reasons they are gated:

1. **They cost money.** Each run makes three separate Gemini analysis calls over two ~9MB videos. Nothing about a normal test run should bill you.
2. **Their writes are permanent.** `tests/integration/AI/conftest.py` defines a module-scoped `db_session` built straight from `SessionLocal()`, which shadows the rolling-back fixture in `tests/conftest.py`. It has no transaction, so anything those tests commit stays in whatever database is configured. Run through `./scripts/test-local.sh` that is a throwaway container and the rows die with the next `db reset` — but a bare `pytest --run-ai` falls back to `.env`, and **`DATABASE_URL` there points at the real project**. Prefer the local script if you have to run these at all.

The second reason is the one that bites silently. Those rows attach to the shared
`test_user`, and `tests/integration/AI/` sorts *before* `tests/integration/db/`, so
in a full run the AI tests write first and later tests see a user carrying analyses
and issues their own fixtures never created. That has been observed changing the
result of tests that assert on that user's issue set.

The gate lives in `tests/conftest.py` (`--run-ai`, `pytest_collection_modifyitems`).
It is **path-based**: anything under `tests/integration/AI/` is gated automatically,
so a new file there is covered without anyone remembering to mark it. The `ai`
marker registered in `pytest.ini` works too, for a live-AI test living elsewhere.

Known over-reach: `TestGoogleAnalysisProtocol::test_client_implements_protocol` is a
pure in-memory conformance check that costs nothing, but it sits in that directory
so it gets skipped with the rest. It would be better placed outside
`tests/integration/AI/`, since it is not an AI test.

## Tests must build their own data

A local database starts **empty**. No migration creates catalog issues or drills — the
15 issues in the remote project were authored through the app, and
`20260711010000_tag_fullswing_catalog.sql` only decorates rows it assumes already exist.

So a test may not read whatever happens to be lying in the database. If you need a row, create it. `db_session` rolls back, so it costs nothing.

One exception is deliberate: `create_analysis_and_analysis_issues` takes an optional
`issues=` argument, because the cross-analysis deactivation test needs two analyses
pointing at the *same* issues. That sharing used to happen by accident.

## Fixtures worth knowing

| Fixture | Scope | Notes |
|---|---|---|
| `db_session` | function | Opens a transaction and **rolls it back** after each test. Writes never persist. |
| `test_user` | session | One real Supabase auth user, shared by the whole run. **Must not be destroyed by any test.** |
| `disposable_user` | function | A throwaway auth user a test is allowed to delete. Use it for anything exercising account deletion. |
| `disposable_auth_headers` | function | Bearer headers for `disposable_user`. |
| `client` | function | `TestClient` with `get_db` overridden to `db_session`. |

### `_shared_user_intact`

An autouse guard that fails the test which destroys the session-scoped `test_user`,
naming it. Without it the damage surfaces much later as unrelated foreign-key
violations in whichever tests happen to run afterwards, pointing at the wrong file
entirely. It only runs for tests that actually requested `test_user`, so tests
needing neither database nor network stay fast.

### The `client` fixture cannot test transaction boundaries

`tests/api/conftest.py` overrides `get_db` with a bare `yield db_session`, replacing
the production commit/rollback wrapper with nothing. **No API test can verify that a
failed request rolls back** — partial rows stay visible inside the test transaction.
That guarantee is covered directly in `tests/integration/db/test_get_db_dependency.py`,
which drives the real `get_db` and checks committed state from a separate connection.

## Other state that outlives a test

Beyond the AI directory, one place still writes outside the rolling-back session:

- `tests/service/test_analysis_service.py` holds a session-scoped second connection
  open for the whole file. Rows written there are invisible to `db_session` tests and
  vice versa.

Not gated today. If a test fails only in a full run and passes on its own, suspect this
before suspecting your change.

Both files also upload a real object to R2, which no transaction can roll back. Each now
deletes it in teardown — `_run_completed_analysis` and the `run_analysis_and_set_completed`
fixture. Cleanup is best-effort and swallows its own errors, so a failed delete prints a
warning rather than failing a test that already passed. If you add another test that
uploads, delete after yourself: nothing else will.
