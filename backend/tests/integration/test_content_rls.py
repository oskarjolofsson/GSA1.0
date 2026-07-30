"""Row-level security on the content catalog, exercised through PostgREST.

The rest of the suite cannot cover this. Every other test reaches Postgres through
`DATABASE_URL` as the `postgres` owner, which bypasses RLS — so a green suite proves
the API still works, not that the catalog is protected. These tests go through the
same PostgREST endpoint a mobile client would, using the anon key that ships in the
app and an authenticated user's key, and assert that reads work while writes do not.

Guarded by 20260730000000_content_rls.sql. If that migration has not been applied to
the database under test, these fail.

Safety: the update and delete probes target a UUID that cannot exist, so they cannot
destroy real rows even if permissions are wide open. The insert probe would create a
row if it unexpectedly succeeded, so it cleans up after itself before failing.
"""

import uuid

import pytest
from postgrest.exceptions import APIError
from supabase import Client, create_client

from core.config import SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLL_KEY, SUPABASE_URL

# No row will ever carry this id, so update/delete probes match nothing.
UNMATCHABLE_ID = "00000000-0000-0000-0000-000000000000"

# SQLSTATE insufficient_privilege. Postgres returns it both for a missing table
# privilege and for an RLS policy refusal. Asserting on it specifically matters:
# the issue_drill payload below carries foreign keys that do not resolve, so a
# permissive database would reject that insert with 23503 (foreign_key_violation).
# Accepting any error would let that count as "write refused" and the test would
# pass against a wide-open catalog.
INSUFFICIENT_PRIVILEGE = "42501"

WRITE_PROTECTED_TABLES = ["issues", "drills", "issue_drill"]
READABLE_TABLES = ["issues", "drills", "issue_drill", "issue_goals", "issue_misses"]

# Minimal rows that satisfy NOT NULL, so a rejection can only be about permission.
INSERT_PAYLOADS = {
    "issues": {"title": "rls probe", "description": "rls probe"},
    "drills": {
        "title": "rls probe",
        "task": "rls probe",
        "success_signal": "rls probe",
        "fault_indicator": "rls probe",
    },
    "issue_drill": {"issue_id": UNMATCHABLE_ID, "drill_id": UNMATCHABLE_ID},
}


@pytest.fixture(scope="module")
def anon_client() -> Client:
    """A client carrying only the anon key — the `anon` Postgres role.

    Deliberately not the shared `supabase_client` fixture, which gets signed in when
    `test_user` is built and would therefore act as `authenticated`.
    """
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


@pytest.fixture(scope="module")
def authenticated_client(test_user) -> Client:
    """A client signed in as a real user — the `authenticated` Postgres role."""
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.auth.set_session(test_user["access_token"], test_user["access_token"])
    return client


@pytest.fixture(scope="module")
def service_client() -> Client:
    """Service role, used only to clean up if a write probe unexpectedly succeeds."""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLL_KEY)


def _client(request, role: str) -> Client:
    return request.getfixturevalue(f"{role}_client")


@pytest.mark.parametrize("role", ["anon", "authenticated"])
@pytest.mark.parametrize("table", READABLE_TABLES)
def test_client_roles_can_read_the_catalog(request, role, table):
    """Reads stay open — the catalog is public content and the app renders it."""
    client = _client(request, role)

    response = client.table(table).select("*").limit(1).execute()

    assert isinstance(response.data, list)


@pytest.mark.parametrize("role", ["anon", "authenticated"])
@pytest.mark.parametrize("table", WRITE_PROTECTED_TABLES)
def test_client_roles_cannot_insert(request, role, table, service_client):
    """An insert must be refused outright, not merely constrained."""
    client = _client(request, role)
    probe_marker = f"rls probe {uuid.uuid4().hex[:8]}"
    payload = dict(INSERT_PAYLOADS[table])
    if "title" in payload:
        payload["title"] = probe_marker

    try:
        response = client.table(table).insert(payload).execute()
    except APIError as exc:
        assert exc.code == INSUFFICIENT_PRIVILEGE, (
            f"{role} INSERT into public.{table} was rejected with {exc.code} "
            f"({exc.message}), not {INSUFFICIENT_PRIVILEGE}. The write was refused "
            f"for some other reason, so this says nothing about permissions."
        )
        return

    # Reached only when the write went through: undo it before failing, so a missing
    # migration does not leave junk in the catalog.
    for row in response.data or []:
        if row.get("id"):
            service_client.table(table).delete().eq("id", row["id"]).execute()
    pytest.fail(
        f"{role} was able to INSERT into public.{table} via PostgREST. "
        f"The anon key ships in the mobile app, so this is a writable catalog. "
        f"Has migration 20260730000000_content_rls.sql been applied?"
    )


@pytest.mark.parametrize("role", ["anon", "authenticated"])
@pytest.mark.parametrize("table", WRITE_PROTECTED_TABLES)
def test_client_roles_cannot_update(request, role, table):
    """Permission is checked before any row is matched, so an unmatchable id still
    has to be refused."""
    client = _client(request, role)

    with pytest.raises(APIError) as exc:
        client.table(table).update({"created_at": "2020-01-01T00:00:00Z"}).eq(
            "id", UNMATCHABLE_ID
        ).execute()
    assert exc.value.code == INSUFFICIENT_PRIVILEGE


@pytest.mark.parametrize("role", ["anon", "authenticated"])
@pytest.mark.parametrize("table", WRITE_PROTECTED_TABLES)
def test_client_roles_cannot_delete(request, role, table):
    client = _client(request, role)

    with pytest.raises(APIError) as exc:
        client.table(table).delete().eq("id", UNMATCHABLE_ID).execute()
    assert exc.value.code == INSUFFICIENT_PRIVILEGE


@pytest.mark.parametrize("role", ["anon", "authenticated"])
@pytest.mark.parametrize("table", ["issue_goals", "issue_misses"])
def test_tag_tables_are_readable_but_not_writable(request, role, table):
    """These two had no grants at all, so PostgREST could not see them even though
    their parent issues were readable. They are now SELECT-only."""
    client = _client(request, role)

    assert isinstance(client.table(table).select("*").limit(1).execute().data, list)

    with pytest.raises(APIError) as exc:
        client.table(table).delete().eq("issue_id", UNMATCHABLE_ID).execute()
    assert exc.value.code == INSUFFICIENT_PRIVILEGE
