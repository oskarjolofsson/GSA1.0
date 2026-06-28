# tests/api/test_issue.py
import pytest
import uuid
from datetime import datetime, timezone

from core.infrastructure.db.repositories.issues import get_issue_by_id
from core.infrastructure.db.models.Issue import Issue
from core.infrastructure.db.models.Analysis import Analysis
from core.infrastructure.db.models.AnalysisIssue import AnalysisIssue
from core.infrastructure.db.models.PracticeSession import PracticeSession

from core.services import user_service


@pytest.fixture(scope="function", autouse=True)
def assign_admin_user(test_user, db_session):
    """Assign admin role to the test user for API authentication."""
    user_service.set_admin(user_id=str(test_user["user_id"]), set_to_admin=True, session=db_session)
    print(f"Assigned admin role to user {test_user['user_id']} for API tests.")


@pytest.fixture()
def issue_with_id(client, auth_headers):
    """Create an issue and return its ID for testing other endpoints."""
    response = client.post(
        "/api/v1/issues/",
        json={
            "title": "Early Extension",
            "description": "Golfer's hips move toward the ball during the downswing",
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


# =========== TODAY'S ISSUE ===========

def _seed_user_issue(db, user_id, title, confidence, completed_sessions):
    """Create an analysis + issue linked to the user, with N completed sessions."""
    analysis = Analysis(user_id=user_id, model_version="test-model", status="completed", success=True)
    db.add(analysis)
    db.flush()

    issue = Issue(title=title, description="d")
    db.add(issue)
    db.flush()

    analysis_issue = AnalysisIssue(
        analysis_id=analysis.id, issue_id=issue.id, confidence=confidence, active=True
    )
    db.add(analysis_issue)
    db.flush()

    now = datetime.now(tz=timezone.utc)
    for _ in range(completed_sessions):
        db.add(
            PracticeSession(
                user_id=user_id,
                analysis_issue_id=analysis_issue.id,
                status="completed",
                started_at=now,
                completed_at=now,
            )
        )
    db.flush()
    return issue


def test_todays_issue_prefers_active_program(client, test_user, db_session, auth_headers):
    """Focus model: the issue with the active program is today's focus, even if
    another issue has higher confidence."""
    from core.infrastructure.db.models.Program import Program
    from core.infrastructure.db.repositories.analysis_issues import (
        get_analysis_issues_by_user_id_and_issue_id,
    )

    user_id = test_user["user_id"]
    _seed_user_issue(db_session, user_id, "Casting", confidence=0.9, completed_sessions=0)
    winner = _seed_user_issue(db_session, user_id, "Early extension", confidence=0.4, completed_sessions=0)

    # Give the lower-confidence issue an active program — it becomes the focus.
    ais = get_analysis_issues_by_user_id_and_issue_id(user_id, winner.id, db_session)
    db_session.add(
        Program(user_id=user_id, analysis_issue_id=ais[0].id, title="Fix early extension", status="active")
    )
    db_session.flush()

    resp = client.get("/api/v1/issues/todays-issue/", headers=auth_headers)

    assert resp.status_code == 200
    data = resp.json()
    assert data is not None
    assert uuid.UUID(data["id"]) == winner.id
    assert data["program_status"] == "active"


def test_todays_issue_tie_breaks_on_confidence(client, test_user, db_session, auth_headers):
    user_id = test_user["user_id"]
    _seed_user_issue(db_session, user_id, "Low conf", confidence=0.2, completed_sessions=0)
    winner = _seed_user_issue(db_session, user_id, "High conf", confidence=0.95, completed_sessions=0)

    resp = client.get("/api/v1/issues/todays-issue/", headers=auth_headers)

    assert resp.status_code == 200
    assert uuid.UUID(resp.json()["id"]) == winner.id


def test_todays_issue_null_when_no_issues(client, test_user, db_session, auth_headers):
    # Route is matched (200), not parsed as an issue_id UUID (would be 404/422).
    resp = client.get("/api/v1/issues/todays-issue/", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() is None


def test_todays_issue_requires_auth(client):
    resp = client.get(
        "/api/v1/issues/todays-issue/", headers={"Authorization": "Bearer invalid-token"}
    )
    assert resp.status_code == 401


def test_create_issue(client, db_session, auth_headers):
    """Test creating a new issue."""
    response = client.post(
        "/api/v1/issues/",
        json={
            "title": "Chicken Wing",
            "description": "Lead elbow bends out away from the body through impact",
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
            "description": "Club moves outside the swing plane on the downswing",
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
            "description": "Wrists unhinge too early in the downswing",
            "phase": "TRANSITION",
        },
        headers=auth_headers,
    )
    client.post(
        "/api/v1/issues/",
        json={
            "title": "Sway",
            "description": "Lower body slides laterally away from target on backswing",
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
    
    response = client.patch(
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
    
    response = client.patch(
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
            "description": "Placeholder description for delete test",
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


def test_bulk_delete_issues(client, db_session, auth_headers):
    """Test deleting multiple issues at once."""
    # Create multiple issues to delete
    issue_ids = []
    for i in range(3):
        response = client.post(
            "/api/v1/issues/",
            json={
                "title": f"Issue to Bulk Delete {i}",
                "description": f"Placeholder description {i}",
                "phase": "IMPACT",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        issue_ids.append(uuid.UUID(response.json()["issue_id"]))
    
    # Verify they exist
    for issue_id in issue_ids:
        assert get_issue_by_id(issue_id=issue_id, session=db_session) is not None
    
    # Bulk delete the issues
    response = client.request(
        "DELETE",
        "/api/v1/issues/bulk",
        json={"issue_ids": [str(i) for i in issue_ids]},
        headers=auth_headers,
    )
    
    assert response.status_code == 204
    
    # Verify they are all deleted
    for issue_id in issue_ids:
        assert get_issue_by_id(issue_id=issue_id, session=db_session) is None


def test_bulk_delete_issues_partial(client, db_session, auth_headers):
    """Test bulk delete with mix of existing and non-existing IDs."""
    # Create one issue
    response = client.post(
        "/api/v1/issues/",
        json={
            "title": "Issue for Partial Bulk Delete",
            "description": "Placeholder description for partial bulk delete test",
            "phase": "IMPACT",
        },
        headers=auth_headers,
    )
    real_issue_id = uuid.UUID(response.json()["issue_id"])
    fake_issue_id = uuid.uuid4()
    
    # Bulk delete with one real and one fake ID
    response = client.request(
        "DELETE",
        "/api/v1/issues/bulk",
        json={"issue_ids": [str(real_issue_id), str(fake_issue_id)]},
        headers=auth_headers,
    )
    
    assert response.status_code == 404
    
    # Verify the real one is not deleted
    assert get_issue_by_id(issue_id=real_issue_id, session=db_session) is not None
