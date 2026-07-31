# Backend tests

```bash
.venv/bin/python -m pytest -q              # everything except the live-AI tests
.venv/bin/python -m pytest tests/api -q    # one directory
```

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
2. **Their writes are permanent.** `tests/integration/AI/conftest.py` defines a module-scoped `db_session` built straight from `SessionLocal()`, which shadows the rolling-back fixture in `tests/conftest.py`. It has no transaction, so anything those tests commit stays in whatever database is configured — and `DATABASE_URL` points at production.

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

Beyond the AI directory, two more places write outside the rolling-back session:

- `tests/service/test_analysis_service.py` holds a session-scoped second connection
  open for the whole file. Rows written there are invisible to `db_session` tests and
  vice versa.
- `tests/api/test_analysis.py` uploads a real object to R2 with no cleanup, leaking
  one per run.

Neither is gated today. If a test fails only in a full run and passes on its own,
suspect one of these before suspecting your change.
