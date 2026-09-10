import uuid

import pytest
from sqlalchemy import text
from supabase_auth.errors import AuthApiError

from core.infrastructure.db.engine import engine

from core.infrastructure.db.repositories import profiles
from core.infrastructure.db import models
from core.services import user_service


# A non-admin user may delete only themselves. Deleting a different user is
# forbidden (403) — the guard raises before any Supabase/profile work.
def test_non_admin_cannot_delete_another_user(test_user, db_session, auth_headers, client):
    other_user_id = uuid.uuid4()  # not the caller, and caller is not admin

    response = client.delete(
        f"/api/v1/users/{other_user_id}/",
        headers=auth_headers,
    )

    assert response.status_code == 403


# The list + search endpoints are require_admin: a non-admin caller gets 403.
def test_list_users_requires_admin(test_user, db_session, auth_headers, client):
    response = client.get("/api/v1/users/", headers=auth_headers)
    assert response.status_code == 403


def test_search_users_requires_admin(test_user, db_session, auth_headers, client):
    response = client.get("/api/v1/users/search/?q=a", headers=auth_headers)
    assert response.status_code == 403


# As an admin, the list endpoint returns a page envelope with the echoed limit.
def test_list_users_as_admin_returns_page(test_user, db_session, auth_headers, client):
    user_service.set_admin(str(test_user["user_id"]), True, db_session)

    response = client.get("/api/v1/users/?limit=5&offset=0", headers=auth_headers)
    assert response.status_code == 200

    body = response.json()
    assert set(body.keys()) >= {"items", "total", "limit", "offset"}
    assert body["limit"] == 5
    assert isinstance(body["items"], list)
    assert len(body["items"]) <= 5


# limit is bounded (le=50); an out-of-range value is a 422 validation error.
def test_list_users_limit_upper_bound(test_user, db_session, auth_headers, client):
    user_service.set_admin(str(test_user["user_id"]), True, db_session)

    response = client.get("/api/v1/users/?limit=100", headers=auth_headers)
    assert response.status_code == 422


# Role endpoint is require_admin: a non-admin caller gets 403.
def test_set_role_requires_admin(test_user, db_session, auth_headers, client):
    response = client.patch(
        f"/api/v1/users/{uuid.uuid4()}/role/",
        headers=auth_headers,
        json={"role": "admin"},
    )
    assert response.status_code == 403


# An admin changing their OWN role is blocked (403) — prevents self-lockout.
def test_set_role_self_change_forbidden(test_user, db_session, auth_headers, client):
    user_service.set_admin(str(test_user["user_id"]), True, db_session)

    response = client.patch(
        f"/api/v1/users/{test_user['user_id']}/role/",
        headers=auth_headers,
        json={"role": "user"},
    )
    assert response.status_code == 403


# An unknown role value is rejected by request validation (422).
def test_set_role_invalid_role(test_user, db_session, auth_headers, client):
    user_service.set_admin(str(test_user["user_id"]), True, db_session)

    response = client.patch(
        f"/api/v1/users/{test_user['user_id']}/role/",
        headers=auth_headers,
        json={"role": "superuser"},
    )
    assert response.status_code == 422


# Uses disposable_user, not the shared test_user: the endpoint really deletes the
# Supabase auth row, which is committed outside the test transaction.
def test_delete_user(disposable_user, db_session, disposable_auth_headers, client):
    # Verify that user exists
    profile: models.Profile = profiles.get_profile_by_id(disposable_user["user_id"], db_session)
    assert profile is not None

    # Make the user delete itself
    response = client.delete(
        f"/api/v1/users/{profile.id}/",
        headers=disposable_auth_headers,
    )

    assert response.status_code == 204

    # Make sure profile is not present anymore
    profile: models.Profile = profiles.get_profile_by_id(disposable_user["user_id"], db_session)
    assert profile is None


# Deleting an account must remove the Supabase auth row, not only the profile.
# A surviving auth row is invisible in the admin panel (which lists profiles) yet
# still signs in — handle_new_user fires on INSERT into auth.users, so the profile
# is never recreated and the account is unreachable for administration.
def test_delete_user_removes_auth_row(
    disposable_user, disposable_auth_headers, client, supabase_admin_client
):
    user_id = str(disposable_user["user_id"])

    response = client.delete(f"/api/v1/users/{user_id}/", headers=disposable_auth_headers)
    assert response.status_code == 204

    with pytest.raises(AuthApiError):
        supabase_admin_client.auth.admin.get_user_by_id(user_id)


# Real accounts own programs. Every other user-scoped table cascades off
# auth.users, so the auth delete must not be blocked by one that does not.
def test_delete_user_with_a_program(
    disposable_user, disposable_auth_headers, client, supabase_admin_client
):
    user_id = str(disposable_user["user_id"])
    program_id = uuid.uuid4()

    # Committed outside db_session on purpose: the rows the auth delete has to
    # cascade through must be visible to GoTrue's own transaction.
    with engine.begin() as connection:
        connection.execute(
            text(
                "INSERT INTO programs (id, user_id, title, status) "
                "VALUES (:id, :user_id, 'Groove the takeaway', 'active')"
            ),
            {"id": str(program_id), "user_id": user_id},
        )

    try:
        response = client.delete(f"/api/v1/users/{user_id}/", headers=disposable_auth_headers)
        assert response.status_code == 204

        with pytest.raises(AuthApiError):
            supabase_admin_client.auth.admin.get_user_by_id(user_id)

        with engine.connect() as connection:
            assert connection.execute(
                text("SELECT 1 FROM programs WHERE id = :id"), {"id": str(program_id)}
            ).first() is None
    finally:
        with engine.begin() as connection:
            connection.execute(
                text("DELETE FROM programs WHERE id = :id"), {"id": str(program_id)}
            )


# The invariant that makes an orphan account impossible: the profile row is the
# only trace the admin panel can see, so it must never be dropped unless the auth
# row is confirmed gone. Supabase is stubbed here because the failure being
# specified — a delete call that reports success without removing the user — is a
# property of that external service, not something the database can be coaxed into.
def test_profile_survives_when_the_auth_user_is_not_actually_deleted(
    disposable_user, disposable_auth_headers, client, monkeypatch
):
    user_id = str(disposable_user["user_id"])

    class _SilentlyFailingAdmin:
        def delete_user(self, uid, should_soft_delete=False):
            return None  # reports success, removes nothing

        def get_user_by_id(self, uid):
            return object()  # user is still there

    class _FakeClient:
        auth = type("_Auth", (), {"admin": _SilentlyFailingAdmin()})()

    monkeypatch.setattr(user_service, "_admin_client", lambda: _FakeClient())

    response = client.delete(f"/api/v1/users/{user_id}/", headers=disposable_auth_headers)
    assert response.status_code == 409
    assert user_id in response.json()["detail"]

    with engine.connect() as connection:
        assert connection.execute(
            text("SELECT 1 FROM profiles WHERE id = :id"), {"id": user_id}
        ).first() is not None


# Admins retry a delete that looked like it failed. The second call must report
# the account is gone (404), not blow up.
def test_deleting_the_same_user_twice_reports_not_found(
    disposable_user, disposable_auth_headers, client
):
    user_id = str(disposable_user["user_id"])

    assert client.delete(f"/api/v1/users/{user_id}/", headers=disposable_auth_headers).status_code == 204

    second = client.delete(f"/api/v1/users/{user_id}/", headers=disposable_auth_headers)
    assert second.status_code == 404
