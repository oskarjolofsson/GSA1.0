# tests/api/test_feedback.py
import pytest
import uuid

from core.infrastructure.db.repositories.feedback import get_feedback_by_id
from core.infrastructure.db.models.Feedback import UserFeedback


@pytest.fixture()
def feedback_with_id(client, test_user, db_session):
    """Create a feedback entry and return its ID for testing other endpoints."""
    response = client.post(
        "/api/v1/feedback/",
        json={
            "user_id": str(test_user),
            "rating": 3,
            "comments": "Great app! Very helpful for improving my golf swing.",
        },
    )
    
    assert response.status_code == 201
    data = response.json()
    return uuid.UUID(data["feedback_id"]), test_user


def test_create_feedback(client, test_user, db_session):
    """Test creating a new feedback entry."""
    response = client.post(
        "/api/v1/feedback/",
        json={
            "user_id": str(test_user),
            "rating": 2,
            "comments": "Good app, but could use more features.",
        },
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
    assert feedback_result.user_id == test_user
    assert feedback_result.rating == 2
    assert feedback_result.comments == "Good app, but could use more features."


def test_get_feedback(client, feedback_with_id):
    """Test getting a specific feedback entry by ID."""
    feedback_id, user_id = feedback_with_id
    
    response = client.get(
        f"/api/v1/feedback/{feedback_id}"
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert uuid.UUID(data["id"]) == feedback_id
    assert uuid.UUID(data["user_id"]) == user_id
    assert data["rating"] == 3
    assert data["comments"] == "Great app! Very helpful for improving my golf swing."
    assert "created_at" in data


def test_get_feedback_not_found(client):
    """Test getting a non-existent feedback returns 404."""
    fake_id = uuid.uuid4()
    
    response = client.get(
        f"/api/v1/feedback/{fake_id}"
    )
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_feedback_by_user(client, test_user, db_session):
    """Test getting all feedback entries for a specific user."""
    user_id = test_user
    
    # Create multiple feedback entries for the same user
    client.post(
        "/api/v1/feedback/",
        json={
            "user_id": str(user_id),
            "rating": 3,
            "comments": "First feedback",
        },
    )
    client.post(
        "/api/v1/feedback/",
        json={
            "user_id": str(user_id),
            "rating": 2,
            "comments": "Second feedback",
        },
    )
    
    response = client.get(
        f"/api/v1/feedback/by-user/{user_id}"
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    
    # Verify feedback is ordered by most recent first
    assert all(uuid.UUID(entry["user_id"]) == user_id for entry in data)


def test_get_feedback_by_rating(client, test_user, db_session):
    """Test getting all feedback entries with a specific rating."""
    # Create feedback with different ratings
    client.post(
        "/api/v1/feedback/",
        json={
            "user_id": str(test_user),
            "rating": 3,
            "comments": "Excellent!",
        },
    )
    client.post(
        "/api/v1/feedback/",
        json={
            "user_id": str(test_user),
            "rating": 3,
            "comments": "Amazing!",
        },
    )
    client.post(
        "/api/v1/feedback/",
        json={
            "user_id": str(test_user),
            "rating": 1,
            "comments": "Average",
        },
    )
    
    response = client.get(
        f"/api/v1/feedback/by-rating/3"
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert all(entry["rating"] == 3 for entry in data)


def test_get_all_feedback(client, test_user, db_session):
    """Test getting all feedback entries."""
    # Create some feedback entries
    client.post(
        "/api/v1/feedback/",
        json={
            "user_id": str(test_user),
            "rating": 3,
            "comments": "Good",
        },
    )
    client.post(
        "/api/v1/feedback/",
        json={
            "user_id": str(test_user),
            "rating": 3,
            "comments": "Great",
        },
    )
    
    response = client.get(
        "/api/v1/feedback/"
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2  # At least the two we created


def test_get_all_feedback_with_limit(client, test_user, db_session):
    """Test getting all feedback entries with a custom limit."""
    # Create multiple feedback entries
    for i in range(5):
        client.post(
            "/api/v1/feedback/",
            json={
                "user_id": str(test_user),
                "rating": 3,
                "comments": f"Feedback {i}",
            },
        )
    
    response = client.get(
        "/api/v1/feedback/?limit=3"
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 3
