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

# The taxonomy tables were locked down in their creating migration (20260802000000)
# rather than a follow-up, precisely because issue_goals and issue_misses shipped
# world-writable for nineteen days when they were not. This is what proves it held.
WRITE_PROTECTED_TABLES = [
    "issues", "drills", "issue_drill",
    "taxonomy_areas", "taxonomy_goals", "taxonomy_misses",
]
READABLE_TABLES = [
    "issues", "drills", "issue_drill", "issue_goals", "issue_misses",
    "taxonomy_areas", "taxonomy_goals", "taxonomy_misses",
]

# Which column the update/delete probes filter on. Everything in the catalog is keyed
# on a uuid `id`; the taxonomy tables use a text `key`. Getting this wrong yields 42703
# (undefined_column) instead of 42501, which would look like a pass if the assertion
# were loose about the code — it is not, deliberately.
ID_COLUMN = {
    "taxonomy_areas": "key",
    "taxonomy_goals": "key",
    "taxonomy_misses": "key",
}
UNMATCHABLE_KEY = "RLS_PROBE_NO_SUCH_KEY"


def _unmatchable(table: str) -> tuple[str, str]:
    """The (column, value) pair that matches no row in `table`."""
    column = ID_COLUMN.get(table, "id")
    return column, (UNMATCHABLE_KEY if column == "key" else UNMATCHABLE_ID)


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
    # Keys that cannot collide with a seeded row, so a rejection can only be about
    # permission. taxonomy_misses carries an area FK that does not resolve, which is
    # why asserting on SQLSTATE 42501 rather than "any error" matters here too.
    "taxonomy_areas": {
        "key": "RLS_PROBE_AREA", "label": "rls probe", "golfer_label": "rls probe",
    },
    "taxonomy_goals": {
        "key": "RLS_PROBE_GOAL", "label": "rls probe", "golfer_label": "rls probe",
    },
    "taxonomy_misses": {
        "key": "RLS_PROBE_MISS", "area": "RLS_PROBE_NOPE",
        "label": "rls probe", "golfer_label": "rls probe",
    },
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
    cleanup_column = ID_COLUMN.get(table, "id")
    for row in response.data or []:
        if row.get(cleanup_column):
            service_client.table(table).delete().eq(
                cleanup_column, row[cleanup_column]
            ).execute()
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

    column, value = _unmatchable(table)
    # `sort` exists on the taxonomy tables, `created_at` on the catalog ones. Either
    # way the column must exist, or the request fails on the wrong thing.
    patch = {"sort": 999} if column == "key" else {"created_at": "2020-01-01T00:00:00Z"}

    with pytest.raises(APIError) as exc:
        client.table(table).update(patch).eq(column, value).execute()
    assert exc.value.code == INSUFFICIENT_PRIVILEGE


@pytest.mark.parametrize("role", ["anon", "authenticated"])
@pytest.mark.parametrize("table", WRITE_PROTECTED_TABLES)
def test_client_roles_cannot_delete(request, role, table):
    client = _client(request, role)

    column, value = _unmatchable(table)

    with pytest.raises(APIError) as exc:
        client.table(table).delete().eq(column, value).execute()
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


# ---------------------------------------------------------------------------
# Tables closed entirely to client roles.
#
# Unlike the catalog above, these are not readable either: nothing reaches them
# through PostgREST, so they carry no grants and no policies. Guarded by
# 20260730020000_close_remaining_tables.sql.
# ---------------------------------------------------------------------------

# table -> (column, value) for a filter that matches nothing. The column has to
# exist on the table: Postgres resolves column names during parse analysis, so a
# bogus one raises 42703 (undefined_column) before any privilege check, and the
# probe would say nothing about permissions.
CLOSED_TABLE_PROBES = {
    "profiles": ("created_at", "1970-01-01T00:00:00Z"),
    "user_roles": ("created_at", "1970-01-01T00:00:00Z"),
    "roles": ("name", "no-such-role"),
    "user_feedback": ("created_at", "1970-01-01T00:00:00Z"),
    "practice_sessions": ("started_at", "1970-01-01T00:00:00Z"),
    "practice_drill_runs": ("started_at", "1970-01-01T00:00:00Z"),
    "prompts": ("created_at", "1970-01-01T00:00:00Z"),
    "billing_customers": ("created_at", "1970-01-01T00:00:00Z"),
    "billing_subscriptions": ("created_at", "1970-01-01T00:00:00Z"),
    "processed_webhook_events": ("processed_at", "1970-01-01T00:00:00Z"),
}
CLOSED_TABLES = sorted(CLOSED_TABLE_PROBES)


@pytest.mark.parametrize("role", ["anon", "authenticated"])
@pytest.mark.parametrize("table", CLOSED_TABLES)
def test_client_roles_cannot_read_closed_tables(request, role, table):
    """A revoked SELECT raises 42501. RLS with no policy would instead return an
    empty list, so accepting [] here would pass against a table that is merely
    policy-filtered rather than actually closed."""
    client = _client(request, role)

    with pytest.raises(APIError) as exc:
        client.table(table).select("*").limit(1).execute()
    assert exc.value.code == INSUFFICIENT_PRIVILEGE, (
        f"{role} SELECT on public.{table} returned {exc.value.code} "
        f"({exc.value.message}) rather than a privilege refusal."
    )


@pytest.mark.parametrize("role", ["anon", "authenticated"])
@pytest.mark.parametrize("table", CLOSED_TABLES)
def test_client_roles_cannot_write_closed_tables(request, role, table):
    client = _client(request, role)
    column, value = CLOSED_TABLE_PROBES[table]

    with pytest.raises(APIError) as exc:
        client.table(table).delete().eq(column, value).execute()
    assert exc.value.code == INSUFFICIENT_PRIVILEGE, (
        f"{role} DELETE on public.{table} returned {exc.value.code} "
        f"({exc.value.message}) rather than a privilege refusal."
    )


def test_anon_cannot_grant_itself_admin(anon_client):
    """The escalation this migration closes, end to end.

    `roles` was readable and `user_roles` was writable, so a client could look up
    the admin role id and insert itself a row. user_service.is_admin() reads
    user_roles directly, so that alone unlocked every require_admin endpoint.
    """
    with pytest.raises(APIError) as exc:
        anon_client.table("roles").select("id").eq("name", "admin").execute()
    assert exc.value.code == INSUFFICIENT_PRIVILEGE

    with pytest.raises(APIError) as exc:
        anon_client.table("user_roles").insert(
            {"user_id": UNMATCHABLE_ID, "role_id": UNMATCHABLE_ID}
        ).execute()
    assert exc.value.code == INSUFFICIENT_PRIVILEGE


def test_anon_cannot_read_user_emails(anon_client):
    """profiles holds email and name for every user."""
    with pytest.raises(APIError) as exc:
        anon_client.table("profiles").select("email").limit(1).execute()
    assert exc.value.code == INSUFFICIENT_PRIVILEGE
