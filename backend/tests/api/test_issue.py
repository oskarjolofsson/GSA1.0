# tests/api/test_issue.py
import pytest
import uuid

from core.infrastructure.db.repositories.issues import get_issue_by_id
from core.infrastructure.db.models.Issue import Issue


@pytest.fixture()
def issue_with_id(client, db_session, auth_headers):
    """Create an issue and return its ID for testing other endpoints."""
    response = client.post(
        "/api/v1/issues/",
        json={
            "title": "Early Extension",
            "phase": "DOWNSWING",
            "current_motion": "Hips thrust forward during downswing",
            "expected_motion": "Hips should rotate while maintaining posture",
            "swing_effect": "Loss of power and inconsistent contact",
            "shot_outcome": "Thin or topped shots",
        },
        headers=auth_headers,
    )
    
    assert response.status_code == 201
    data = response.json()
    return uuid.UUID(data["issue_id"])


def test_create_issue(client, db_session, auth_headers):
    """Test creating a new issue."""
    response = client.post(
        "/api/v1/issues/",
        json={
            "title": "Chicken Wing",
            "phase": "FOLLOW_THROUGH",
            "current_motion": "Lead elbow bends and pulls away from body",
            "expected_motion": "Lead arm should extend through impact",
            "swing_effect": "Reduced power and accuracy",
            "shot_outcome": "Weak shots and slices",
        },
        headers=auth_headers,
    )
    
    data = response.json()
    
    assert response.status_code == 201
    assert data["success"] is True
    assert "issue_id" in data
    assert isinstance(data["issue_id"], str)
    
    # Check that the issue was inserted in the database correctly
    issue_id = uuid.UUID(data["issue_id"])
    issue_result: Issue = get_issue_by_id(issue_id=issue_id, session=db_session)
    assert issue_result is not None
    assert issue_result.title == "Chicken Wing"
    assert issue_result.phase == "FOLLOW_THROUGH"
    assert issue_result.current_motion == "Lead elbow bends and pulls away from body"
    assert issue_result.expected_motion == "Lead arm should extend through impact"
    assert issue_result.swing_effect == "Reduced power and accuracy"
    assert issue_result.shot_outcome == "Weak shots and slices"


def test_create_issue_minimal_fields(client, db_session, auth_headers):
    """Test creating an issue with only required fields."""
    response = client.post(
        "/api/v1/issues/",
        json={
            "title": "Over the Top",
        },
        headers=auth_headers,
    )
    
    data = response.json()
    
    assert response.status_code == 201
    assert data["success"] is True
    
    # Verify in database
    issue_id = uuid.UUID(data["issue_id"])
    issue_result: Issue = get_issue_by_id(issue_id=issue_id, session=db_session)
    assert issue_result is not None
    assert issue_result.title == "Over the Top"
    assert issue_result.phase is None
    assert issue_result.current_motion is None


def test_get_issue(client, issue_with_id, auth_headers):
    """Test getting a specific issue by ID."""
    issue_id = issue_with_id
    
    response = client.get(
        f"/api/v1/issues/{issue_id}",
        headers=auth_headers,
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert uuid.UUID(data["id"]) == issue_id
    assert data["title"] == "Early Extension"
    assert data["phase"] == "DOWNSWING"
    assert data["current_motion"] == "Hips thrust forward during downswing"
    assert data["expected_motion"] == "Hips should rotate while maintaining posture"
    assert data["swing_effect"] == "Loss of power and inconsistent contact"
    assert data["shot_outcome"] == "Thin or topped shots"
    assert "created_at" in data


def test_get_issue_not_found(client, auth_headers):
    """Test getting a non-existent issue returns 404."""
    fake_id = uuid.uuid4()
    
    response = client.get(
        f"/api/v1/issues/{fake_id}",
        headers=auth_headers,
    )
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_all_issues(client, db_session, auth_headers):
    """Test getting all issues."""
    # Create multiple issues
    client.post(
        "/api/v1/issues/",
        json={
            "title": "Cast from the Top",
            "phase": "TRANSITION",
        },
        headers=auth_headers,
    )
    client.post(
        "/api/v1/issues/",
        json={
            "title": "Sway",
            "phase": "BACKSWING",
        },
        headers=auth_headers,
    )
    
    response = client.get(
        "/api/v1/issues/all",  # Changed from "/" to "/all"
        headers=auth_headers,
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2  # At least the two we created


def test_get_issues_by_analysis(client, db_session, auth_headers):
    """Test getting all issues for a specific analysis."""
    fake_analysis_id = uuid.uuid4()
    
    response = client.get(
        f"/api/v1/issues/by-analysis/{fake_analysis_id}",
        headers=auth_headers,
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0  # No issues associated with this analysis


def test_get_issues_by_drill(client, db_session, auth_headers):
    """Test getting all issues for a specific drill."""
    fake_drill_id = uuid.uuid4()
    
    response = client.get(
        f"/api/v1/issues/by-drill/{fake_drill_id}",
        headers=auth_headers,
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0  # No issues associated with this drill


def test_update_issue(client, issue_with_id, db_session, auth_headers):
    """Test updating an existing issue."""
    issue_id = issue_with_id
    
    response = client.put(
        f"/api/v1/issues/{issue_id}",
        json={
            "title": "Updated Early Extension",
            "swing_effect": "Updated swing effect description",
        },
        headers=auth_headers,
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert uuid.UUID(data["id"]) == issue_id
    assert data["title"] == "Updated Early Extension"
    assert data["swing_effect"] == "Updated swing effect description"
    # Original values should remain unchanged
    assert data["phase"] == "DOWNSWING"
    assert data["current_motion"] == "Hips thrust forward during downswing"
    
    # Verify in database
    issue_result: Issue = get_issue_by_id(issue_id=issue_id, session=db_session)
    assert issue_result.title == "Updated Early Extension"
    assert issue_result.swing_effect == "Updated swing effect description"


def test_update_issue_not_found(client, auth_headers):
    """Test updating a non-existent issue returns 404."""
    fake_id = uuid.uuid4()
    
    response = client.put(
        f"/api/v1/issues/{fake_id}",
        json={
            "title": "Updated Title",
        },
        headers=auth_headers,
    )
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_delete_issue(client, db_session, auth_headers):
    """Test deleting an issue."""
    # Create an issue to delete
    response = client.post(
        "/api/v1/issues/",
        json={
            "title": "Issue to Delete",
            "phase": "IMPACT",
        },
        headers=auth_headers,
    )
    issue_id = uuid.UUID(response.json()["issue_id"])
    
    # Verify it exists
    assert get_issue_by_id(issue_id=issue_id, session=db_session) is not None
    
    # Delete the issue
    response = client.delete(
        f"/api/v1/issues/{issue_id}",
        headers=auth_headers,
    )
    
    assert response.status_code == 204
    
    # Verify it's deleted
    assert get_issue_by_id(issue_id=issue_id, session=db_session) is None


def test_delete_issue_not_found(client, auth_headers):
    """Test deleting a non-existent issue returns 404."""
    fake_id = uuid.uuid4()
    
    response = client.delete(
        f"/api/v1/issues/{fake_id}",
        headers=auth_headers,
    )
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
