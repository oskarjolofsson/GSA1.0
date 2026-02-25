# tests/api/test_drill.py
import pytest
import uuid

from core.infrastructure.db.repositories.drills import get_drill_by_id
from core.infrastructure.db.models.Drill import Drill


@pytest.fixture()
def drill_with_id(client, db_session, auth_headers):
    """Create a drill and return its ID for testing other endpoints."""
    response = client.post(
        "/api/v1/drills/",
        json={
            "title": "Test Drill",
            "task": "Practice proper grip",
            "success_signal": "Consistent ball striking",
            "fault_indicator": "Slicing shots to the right",
        },
        headers=auth_headers,
    )
    
    assert response.status_code == 201
    data = response.json()
    return uuid.UUID(data["drill_id"])


def test_create_drill(client, db_session, auth_headers):
    """Test creating a new drill."""
    response = client.post(
        "/api/v1/drills/",
        json={
            "title": "Weight Transfer Drill",
            "task": "Shift weight from back foot to front foot during swing",
            "success_signal": "Power increase and better ball flight",
            "fault_indicator": "Falling back on follow-through",
        },
        headers=auth_headers,
    )
    
    data = response.json()
    
    assert response.status_code == 201
    assert data["success"] is True
    assert "drill_id" in data
    assert isinstance(data["drill_id"], str)
    
    # Check that the drill was inserted in the database correctly
    drill_id = uuid.UUID(data["drill_id"])
    drill_result: Drill = get_drill_by_id(drill_id=drill_id, session=db_session)
    assert drill_result is not None
    assert drill_result.title == "Weight Transfer Drill"
    assert drill_result.task == "Shift weight from back foot to front foot during swing"
    assert drill_result.success_signal == "Power increase and better ball flight"
    assert drill_result.fault_indicator == "Falling back on follow-through"


def test_get_drill(client, drill_with_id, auth_headers):
    """Test getting a specific drill by ID."""
    drill_id = drill_with_id
    
    response = client.get(
        f"/api/v1/drills/{drill_id}",
        headers=auth_headers,
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert uuid.UUID(data["id"]) == drill_id
    assert data["title"] == "Test Drill"
    assert data["task"] == "Practice proper grip"
    assert data["success_signal"] == "Consistent ball striking"
    assert data["fault_indicator"] == "Slicing shots to the right"
    assert "created_at" in data


def test_get_drill_not_found(client, auth_headers):
    """Test getting a non-existent drill returns 404."""
    fake_id = uuid.uuid4()
    
    response = client.get(
        f"/api/v1/drills/{fake_id}",
        headers=auth_headers,
    )
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_drills_by_user(client, test_user, db_session, auth_headers):
    """Test getting all drills for a specific user."""
    user_id = test_user["user_id"]
    
    # Create a drill linked to a user via analysis and issue
    # For this test, we'll just check the endpoint returns empty list
    # since the drill-user relationship is indirect through analysis
    response = client.get(
        f"/api/v1/drills/by-user/{user_id}",
        headers=auth_headers,
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_drills_by_analysis(client, db_session, auth_headers):
    """Test getting all drills for a specific analysis."""
    fake_analysis_id = uuid.uuid4()
    
    response = client.get(
        f"/api/v1/drills/by-analysis/{fake_analysis_id}",
        headers=auth_headers,
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0  # No drills associated with this analysis


def test_get_drills_by_issue(client, db_session, auth_headers):
    """Test getting all drills for a specific issue."""
    fake_issue_id = uuid.uuid4()
    
    response = client.get(
        f"/api/v1/drills/by-issue/{fake_issue_id}",
        headers=auth_headers,
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0  # No drills associated with this issue


def test_update_drill(client, drill_with_id, db_session, auth_headers):
    """Test updating an existing drill."""
    drill_id = drill_with_id
    
    response = client.put(
        f"/api/v1/drills/{drill_id}",
        json={
            "title": "Updated Drill Title",
            "task": "Updated task description",
        },
        headers=auth_headers,
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert uuid.UUID(data["id"]) == drill_id
    assert data["title"] == "Updated Drill Title"
    assert data["task"] == "Updated task description"
    # Original values should remain unchanged
    assert data["success_signal"] == "Consistent ball striking"
    assert data["fault_indicator"] == "Slicing shots to the right"
    
    # Verify in database
    drill_result: Drill = get_drill_by_id(drill_id=drill_id, session=db_session)
    assert drill_result.title == "Updated Drill Title"
    assert drill_result.task == "Updated task description"


def test_update_drill_not_found(client, auth_headers):
    """Test updating a non-existent drill returns 404."""
    fake_id = uuid.uuid4()
    
    response = client.put(
        f"/api/v1/drills/{fake_id}",
        json={
            "title": "Updated Title",
        },
        headers=auth_headers,
    )
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_delete_drill(client, db_session, auth_headers):
    """Test deleting a drill."""
    # Create a drill to delete
    response = client.post(
        "/api/v1/drills/",
        json={
            "title": "Drill to Delete",
            "task": "To be removed",
            "success_signal": "N/A",
            "fault_indicator": "N/A",
        },
        headers=auth_headers,
    )
    drill_id = uuid.UUID(response.json()["drill_id"])
    
    # Verify it exists
    assert get_drill_by_id(drill_id=drill_id, session=db_session) is not None
    
    # Delete the drill
    response = client.delete(
        f"/api/v1/drills/{drill_id}",
        headers=auth_headers,
    )
    
    assert response.status_code == 204
    
    # Verify it's deleted
    assert get_drill_by_id(drill_id=drill_id, session=db_session) is None


def test_delete_drill_not_found(client, auth_headers):
    """Test deleting a non-existent drill returns 404."""
    fake_id = uuid.uuid4()
    
    response = client.delete(
        f"/api/v1/drills/{fake_id}",
        headers=auth_headers,
    )
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_bulk_delete_drills(client, db_session, auth_headers):
    """Test deleting multiple drills at once."""
    # Create multiple drills to delete
    drill_ids = []
    for i in range(3):
        response = client.post(
            "/api/v1/drills/",
            json={
                "title": f"Drill to Bulk Delete {i}",
                "task": f"Task {i}",
                "success_signal": "N/A",
                "fault_indicator": "N/A",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        drill_ids.append(uuid.UUID(response.json()["drill_id"]))
    
    # Verify they exist
    for drill_id in drill_ids:
        assert get_drill_by_id(drill_id=drill_id, session=db_session) is not None
    
    # Bulk delete the drills
    response = client.request(
        "DELETE",
        "/api/v1/drills/bulk",
        json={"drill_ids": [str(d) for d in drill_ids]},
        headers=auth_headers,
    )
    
    assert response.status_code == 204
    
    # Verify they are all deleted
    for drill_id in drill_ids:
        assert get_drill_by_id(drill_id=drill_id, session=db_session) is None


def test_bulk_delete_drills_partial(client, db_session, auth_headers):
    """Test bulk delete with mix of existing and non-existing IDs."""
    # Create one drill
    response = client.post(
        "/api/v1/drills/",
        json={
            "title": "Drill for Partial Bulk Delete",
            "task": "Task",
            "success_signal": "N/A",
            "fault_indicator": "N/A",
        },
        headers=auth_headers,
    )
    real_drill_id = uuid.UUID(response.json()["drill_id"])
    fake_drill_id = uuid.uuid4()
    
    # Bulk delete with one real and one fake ID
    response = client.request(
        "DELETE",
        "/api/v1/drills/bulk",
        json={"drill_ids": [str(real_drill_id), str(fake_drill_id)]},
        headers=auth_headers,
    )
    
    assert response.status_code == 404      # All or nothing approach - if any ID is invalid, the whole operation fails
    
    # Verify the real one is not deleted
    assert get_drill_by_id(drill_id=real_drill_id, session=db_session) is not None
