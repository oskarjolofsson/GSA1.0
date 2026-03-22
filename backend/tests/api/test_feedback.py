# tests/api/test_feedback.py
import pytest
import uuid

from core.services import user_service
from core.infrastructure.db.repositories.feedback import get_feedback_by_id
from core.infrastructure.db.models.Feedback import UserFeedback


@pytest.fixture(scope="function", autouse=True)
def assign_admin_user(test_user, db_session):
    """Assign admin role to the test user for API authentication."""
    user_service.set_admin(user_id=str(test_user["user_id"]), set_to_admin=True, session=db_session)
    print(f"Assigned admin role to user {test_user['user_id']} for API tests.")


@pytest.fixture()
def feedback_with_id(client, test_user, auth_headers):
    """Create a feedback entry and return its ID for testing other endpoints."""
    response = client.post(
        "/api/v1/feedback/",
        json={
            "rating": 3,
            "comments": "Great app! Very helpful for improving my golf swing.",
        },
        headers=auth_headers,
    )
    
    assert response.status_code == 201
    data = response.json()
    return uuid.UUID(data["feedback_id"]), test_user["user_id"]


def test_create_feedback(client, test_user, db_session, auth_headers):
    """Test creating a new feedback entry."""
    response = client.post(
        "/api/v1/feedback/",
        json={
            "rating": 2,
            "comments": "Good app, but could use more features.",
        },
        headers=auth_headers,
    )
    
    data = response.json()
    
    assert response.status_code == 201
    assert data["success"] is True
    assert "feedback_id" in data
    assert isinstance(data["feedback_id"], str)
    
    # Check that the feedback was inserted in the database correctly
    feedback_id = uuid.UUID(data["feedback_id"])
    feedback_result: UserFeedback = get_feedback_by_id(feedback_id=str(feedback_id), session=db_session)
    assert feedback_result is not None
    assert feedback_result.user_id == test_user["user_id"]
    assert feedback_result.rating == 2
    assert feedback_result.comments == "Good app, but could use more features."


def test_get_feedback(client, feedback_with_id, auth_headers):
    """Test getting a specific feedback entry by ID."""
    feedback_id, user_id = feedback_with_id
    
    response = client.get(
        f"/api/v1/feedback/",
        headers=auth_headers,
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Find the feedback entry in the response
    feedback_entry = next((entry for entry in data if entry["id"] == str(feedback_id)), None)
    assert feedback_entry is not None, "Feedback entry not found in response"
    
    assert uuid.UUID(feedback_entry["id"]) == feedback_id
    assert uuid.UUID(feedback_entry["user_id"]) == user_id
    assert feedback_entry["rating"] == 3
    assert feedback_entry["comments"] == "Great app! Very helpful for improving my golf swing."
    assert "created_at" in feedback_entry


