import uuid

from core.infrastructure.db.repositories import profiles
from core.infrastructure.db import models


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
