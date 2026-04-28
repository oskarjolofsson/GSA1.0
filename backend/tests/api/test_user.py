from core.infrastructure.db.repositories import profiles
from core.infrastructure.db import models


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
    
    
# Test so unauthorized user can not delete another user
# TODO