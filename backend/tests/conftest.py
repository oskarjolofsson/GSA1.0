import uuid
import pytest
import time
from sqlalchemy import text
from supabase import create_client, Client
from core.infrastructure.db.engine import engine
from core.infrastructure.db.session import SessionLocal
from core.config import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLL_KEY


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
