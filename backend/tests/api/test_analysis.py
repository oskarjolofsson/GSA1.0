# tests/api/test_analysis.py
import pytest
import uuid

from sqlalchemy import text

from core.infrastructure.db.repositories.analysis import get_analysis_by_id, get_analyses_by_user_id
from core.infrastructure.db.repositories.videos import get_video_by_id
from core.infrastructure.db.models.Video import Video
from core.infrastructure.db.models.Analysis import Analysis


@pytest.fixture()
def analysis_with_id(client, test_user, db_session):
    """Create an analysis and return its ID for testing other endpoints."""
    response = client.post(
        "/api/v1/analyses/",
        json={
            "user_id": str(test_user),
            "model": "gemini-3-pro-preview",
            "start_time": 0,
            "end_time": 10,
        },
    )
    data = response.json()
    return uuid.UUID(data["analysis_id"]), test_user


def test_create_analysis(client, test_user, db_session):
    response = client.post(
        "/api/v1/analyses/",
        json={
            "user_id": str(test_user),
            "model": "gemini-3-pro-preview",
            "start_time": 0,
            "end_time": 10,
        },
    )
    
    data = response.json()
    
    assert response.status_code == 201
    assert data["success"] is True
    assert "analysis_id" in data
    assert "upload_url" in data
    assert isinstance(data["analysis_id"], str)
    assert isinstance(data["upload_url"], str)
    assert len(data["upload_url"]) > 0
    
    # Check that all was inserted in the database correctly
    analysis_id = uuid.UUID(data["analysis_id"])
    analysis_result: Analysis = get_analysis_by_id(analysis_id=analysis_id, session=db_session)
    assert analysis_result is not None
    assert analysis_result.user_id == test_user
    assert analysis_result.model_version == "gemini-3-pro-preview"
    assert analysis_result.status == "awaiting_upload"
    assert analysis_result.video_id is not None
    
    # Check that the video was created in the database correctly
    video_result: Video = get_video_by_id(video_id=analysis_result.video_id, session=db_session)
    assert video_result is not None
    assert video_result.user_id == test_user
    assert video_result.start_time.total_seconds() == 0
    assert video_result.end_time.total_seconds() == 10
    assert video_result.video_key is not None


def test_list_analyses(client, test_user, analysis_with_id):
    """Test listing all analyses for a user, when no analysis have been completed."""
    analysis_id, user_id = analysis_with_id
    
    response = client.get(
        f"/api/v1/analyses/?user_id={user_id}"
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0
    
    # Check that our created analysis is in the list
    analysis_ids = [uuid.UUID(a["analysis_id"]) for a in data]
    assert analysis_id in analysis_ids


def test_get_analysis(client, test_user, analysis_with_id):
    """Test getting a specific analysis by ID."""
    analysis_id, user_id = analysis_with_id
    
    response = client.get(
        f"/api/v1/analyses/{analysis_id}"
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert uuid.UUID(data["analysis_id"]) == analysis_id
    assert uuid.UUID(data["user_id"]) == user_id
    assert data["model_version"] == "gemini-3-pro-preview"
    assert data["status"] == "awaiting_upload"
    assert "created_at" in data
    assert "video_id" in data


def test_get_analysis_video_url(client, analysis_with_id):
    """Test getting the video URL for an analysis."""
    analysis_id, _ = analysis_with_id
    
    response = client.get(
        f"/api/v1/analyses/{analysis_id}/video-url"
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert "video_url" in data
    assert isinstance(data["video_url"], str)


def test_get_analysis_issues(client, analysis_with_id):
    """Test getting all issues for an analysis."""
    analysis_id, _ = analysis_with_id
    
    response = client.get(
        f"/api/v1/analyses/{analysis_id}/issues"
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Should be an empty list initially since no issues have been added
    assert isinstance(data, list)
    assert len(data) == 0


def test_delete_analysis(client, test_user, db_session):
    """Test deleting an analysis."""
    # Create an analysis to delete
    response = client.post(
        "/api/v1/analyses/",
        json={
            "user_id": str(test_user),
            "model": "gemini-3-pro-preview",
            "start_time": 0,
            "end_time": 10,
        },
    )
    analysis_id = uuid.UUID(response.json()["analysis_id"])
    
    # Verify it exists
    assert get_analysis_by_id(analysis_id=analysis_id, session=db_session) is not None
    
    # Delete the analysis
    response = client.delete(
        f"/api/v1/analyses/{analysis_id}"
    )
    
    assert response.status_code == 200
    
    # Verify it's deleted
    assert get_analysis_by_id(analysis_id=analysis_id, session=db_session) is None


def test_delete_analysis_issue(client, analysis_with_id):
    """Test deleting a specific analysis issue."""
    analysis_id, _ = analysis_with_id
    
    # Since we don't have issues in the test, we just test the endpoint structure
    # This test will verify that the endpoint is reachable and properly handles
    # the deletion of a non-existent issue (which should not error out)
    test_issue_id = uuid.uuid4()
    
    response = client.delete(
        f"/api/v1/analyses/{analysis_id}/issues/{test_issue_id}"
    )
    
    # The endpoint should return 200
    assert response.status_code == 200


