import uuid
import pytest
import time
from pathlib import Path
from sqlalchemy import text
from supabase import create_client, Client
from core.infrastructure.db.engine import engine
from core.infrastructure.db.session import SessionLocal
from core.config import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLL_KEY
from core.services import taxonomy


# ---------------------------------------------------------------------------
# Opt-in gate for the live-AI tests.
#
# Everything under tests/integration/AI/ calls the real Gemini API on real video,
# which costs money per run, and writes through a module-scoped session that is
# never rolled back (tests/integration/AI/conftest.py), so its rows persist in
# whatever database is configured. Those rows attach to the shared `test_user` and
# have been observed changing the outcome of later tests that assert on that user's
# issues — the AI directory sorts before tests/integration/db/, so it runs first.
#
# They are therefore skipped by default and run only when asked for:
#
#     pytest                                   AI tests skipped
#     pytest --run-ai                           everything, including AI
#     pytest --run-ai tests/integration/AI      only the AI tests
#
# Skipped rather than deselected on purpose: the run still reports them, so it is
# obvious they exist and were not run.
# ---------------------------------------------------------------------------

AI_TEST_DIR = "AI"


def pytest_addoption(parser):
    parser.addoption(
        "--run-ai",
        action="store_true",
        default=False,
        help=(
            "Run the live-AI tests. They call the billed Gemini API and write rows "
            "that are not rolled back. Skipped without this flag."
        ),
    )


def _is_ai_test(item) -> bool:
    """Marked `ai`, or living under tests/integration/AI/.

    Path-based as well as marker-based so a new file in that directory is gated
    without anyone remembering to mark it.
    """
    if item.get_closest_marker("ai"):
        return True
    return AI_TEST_DIR in item.path.parts


def pytest_collection_modifyitems(config, items):
    if config.getoption("--run-ai"):
        return
    skip_ai = pytest.mark.skip(
        reason="live-AI test: billed Gemini call and unrolled-back writes. Use --run-ai."
    )
    for item in items:
        if _is_ai_test(item):
            item.add_marker(skip_ai)


@pytest.fixture(autouse=True)
def _cold_taxonomy_cache():
    """Start and end every test with an empty taxonomy cache.

    `core.services.taxonomy` holds the vocabulary in a process-level cache so its pure
    validators need no session. That state outlives a test, and `db_session` rolls back —
    so a test that inserts a miss, reads it through a service, then rolls back would leave
    the cache serving a row that no longer exists, and the next test would see it.

    Same class of problem as `_shared_user_intact` below: cheap to prevent, and miserable
    to diagnose otherwise because the failure surfaces in whichever test happens to run
    next rather than the one that caused it.
    """
    taxonomy.reset_cache()
    yield
    taxonomy.reset_cache()


@pytest.fixture(scope="session")
def sample_video_path() -> Path:
    """The golf clip the analysis tests upload to R2.

    `uploads/` is gitignored (.gitignore:118) and golf.mp4 is 8.6MB, so it exists on a
    developer's machine and never in CI. Skip rather than fail — the same convention
    tests/integration/AI/conftest.py already uses for its own videos.

    These tests are NOT the live-AI tests: they mock the Gemini call and only need
    bytes to push through the real upload path. They are gated on the file existing,
    not on --run-ai.
    """
    path = Path(__file__).resolve().parent.parent / "uploads" / "video" / "golf.mp4"
    if not path.exists():
        pytest.skip(
            f"Sample video not present at {path}. uploads/ is gitignored, so these "
            "run locally but not in CI."
        )
    return path


@pytest.fixture(scope="function")
def db_session():
    """Function-scoped session for fast, isolated tests."""
    connection = engine.connect()
    transaction = connection.begin()
    session = SessionLocal(bind=connection)
    
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(scope="session")
def supabase_client() -> Client:
    """Create a Supabase client for authentication testing."""
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    return client


@pytest.fixture(scope="session")
def supabase_admin_client() -> Client:
    """Create a Supabase admin client with service role key for user management."""
    admin_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLL_KEY)
    return admin_client


def _create_supabase_user(admin_client: Client, anon_client: Client) -> dict:
    """Create a real Supabase auth user, sign it in, and return its identity.

    Inserting into auth.users fires the handle_new_user trigger, so a matching
    `profiles` row exists by the time this returns. Both are committed outside any
    test transaction and must be deleted explicitly.
    """
    unique_id = str(uuid.uuid4().hex)[:8]
    timestamp = int(time.time())
    test_email = f"test{timestamp}{unique_id}@test.local".strip()
    test_password = "TestPassword123!"

    admin_client.auth.admin.create_user({
        "email": test_email,
        "password": test_password,
        "email_confirm": True,
        "user_metadata": {
            "name": "Test User",
        }
    })

    response = anon_client.auth.sign_in_with_password({
        "email": test_email,
        "password": test_password,
    })

    return {
        "access_token": response.session.access_token,
        "user_id": uuid.UUID(response.user.id),
        "email": test_email,
        "name": response.user.user_metadata.get("name"),
    }


def _delete_supabase_user(admin_client: Client, user_id) -> None:
    """Best-effort delete. Never fails a test — the user may already be gone."""
    try:
        admin_client.auth.admin.delete_user(str(user_id))
    except Exception as e:
        print(f"Warning: Failed to cleanup test user {user_id}: {e}")


@pytest.fixture(scope="session")
def test_user(supabase_client: Client, supabase_admin_client: Client):
    """The shared authenticated user, created once for the whole session.

    MUST NOT be destroyed by any test. Deleting it removes the auth.users row and
    cascades away its profile, both committed outside the test transaction, so every
    later test inserting a row that references this user_id fails on a foreign key.
    Anything exercising account deletion should use `disposable_user` instead; the
    `_shared_user_intact` guard below enforces this.
    """
    user = _create_supabase_user(supabase_admin_client, supabase_client)
    yield user
    _delete_supabase_user(supabase_admin_client, user["user_id"])


@pytest.fixture()
def disposable_user(supabase_client: Client, supabase_admin_client: Client):
    """A throwaway auth user that a test is allowed to destroy.

    Use in place of `test_user` whenever the behaviour under test deletes an
    account, so the shared user survives for the rest of the session.
    """
    user = _create_supabase_user(supabase_admin_client, supabase_client)
    yield user
    _delete_supabase_user(supabase_admin_client, user["user_id"])


@pytest.fixture()
def disposable_auth_headers(disposable_user):
    """Bearer headers for `disposable_user`.

    Needed because DELETE /users/{id}/ takes the caller from the token and only
    allows self-deletion (or an admin), so the throwaway user must call as itself.
    """
    return {"Authorization": f"Bearer {disposable_user['access_token']}"}


@pytest.fixture(autouse=True)
def _shared_user_intact(request):
    """Fail the test that destroys the session-scoped `test_user`.

    Without this the damage surfaces much later as unrelated foreign key violations
    in whichever tests happen to be collected afterwards, which points at the wrong
    file entirely.

    Only runs for tests that actually requested `test_user` — checking
    `request.fixturenames` rather than the fixture value keeps tests that need
    neither database nor network exactly as fast as before. The check uses its own
    connection because `db_session` is rolled back around each test, while the
    deletion this is looking for is committed externally.
    """
    yield

    if "test_user" not in request.fixturenames:
        return

    user_id = request.getfixturevalue("test_user")["user_id"]
    with engine.connect() as connection:
        still_there = connection.execute(
            text("SELECT 1 FROM profiles WHERE id = :id"),
            {"id": str(user_id)},
        ).first()

    if still_there is None:
        pytest.fail(
            f"{request.node.nodeid} destroyed the shared session-scoped test_user "
            f"({user_id}). Every later test using test_user will now fail on a "
            f"foreign key against auth.users. Use the `disposable_user` fixture for "
            f"tests that delete an account.",
            pytrace=False,
        )
