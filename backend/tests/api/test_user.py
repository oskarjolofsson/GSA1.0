import uuid

from core.infrastructure.db.repositories import profiles
from core.infrastructure.db import models
from core.services import user_service


# NOTE ON ORDERING: test_delete_user performs a REAL Supabase
# auth.admin.delete_user on the session-scoped test_user (not rolled back with
# the db transaction), which cascades and removes test_user's profile. Any test
# that needs test_user must therefore run BEFORE it — keep the self-delete test
# last in this module.


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


# Keep last — really deletes the shared test_user in Supabase (see note above).
def test_delete_user(test_user, db_session, auth_headers, client):
    # Verify that user exists
    profile: models.Profile = profiles.get_profile_by_id(test_user["user_id"], db_session)
    assert profile is not None

    # Make the user delete itself
    response = client.delete(
        f"/api/v1/users/{profile.id}/",
        headers=auth_headers,
    )

    assert response.status_code == 204

    # Make sure profile is not present anymore
    profile: models.Profile = profiles.get_profile_by_id(test_user["user_id"], db_session)
    assert profile is None
