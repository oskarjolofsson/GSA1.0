# tests/api/test_analysis.py
import pytest
import uuid

from sqlalchemy import text

from core.infrastructure.db.repositories.analysis import get_analysis_by_id, get_analyses_by_user_id
from core.infrastructure.db.repositories.videos import get_video_by_analysis_id, get_video_by_id
from core.infrastructure.db.repositories.analysis_issues import get_analysis_issues_by_analysis_id as get_analysis_issues_by_analysis_id, get_analysis_issue_by_id
from core.infrastructure.db.models.AnalysisIssue import AnalysisIssue
from core.infrastructure.db.models.Video import Video
from core.infrastructure.db.models.Analysis import Analysis
from pathlib import Path
from core.infrastructure.storage.r2Adaptor import generate_upload_url
import requests


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
    
    assert response.status_code == 201
    data = response.json()
    return uuid.UUID(data["analysis_id"]), test_user

@pytest.fixture()
def run_analysis_and_set_completed(client, db_session, analysis_with_id):
    """Helper function to set an analysis as completed for testing."""
    analysis_id, user_id = analysis_with_id
    video_object: Video = get_video_by_analysis_id(analysis_id=analysis_id, session=db_session)
    video_key = video_object.video_key
    
    video_path = Path("uploads/video/golf.mp4")
    video_blob = video_path.read_bytes()
    upload_url = generate_upload_url(key=video_key)
    
    # Simulate uploading the video to the storage using the generated upload URL
    upload_response = requests.put(upload_url, data=video_blob)
    assert upload_response.status_code in [200, 201], f"Failed to upload video, status code: {upload_response.status_code}, response: {upload_response.text}"

    response = client.patch(
        f"/api/v1/analyses/{analysis_id}/"
    )
    
    data = response.json()
    return data, analysis_id, user_id
    

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


def test_list_analyses(client, analysis_with_id):
    """Test listing all analyses for a user, when no analysis have been completed."""
    analysis_id, user_id = analysis_with_id
    
    response = client.get(
        f"/api/v1/analyses/?user_id={user_id}"
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0
    

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
    
    assert response.status_code == 204
    
    # Verify it's deleted
    assert get_analysis_by_id(analysis_id=analysis_id, session=db_session) is None


def test_run_analysis(client, run_analysis_and_set_completed, db_session):
    """Test running an analysis, when the video upload has completed."""
    analysis_data, analysis_id, user_id = run_analysis_and_set_completed
    
    print("Analysis data after running analysis:", analysis_data)
    assert analysis_data["status"] == "completed", f"Expected status to be 'completed' but got {analysis_data['status']} from {analysis_data}"
    assert analysis_data["success"] is True
    assert analysis_data["error_message"] is None  
    
    
    assert analysis_data["analysis_id"] == str(analysis_id)
    assert analysis_data["user_id"] == str(user_id)
    
    # Check that all info is in the db
    db_analysis = get_analysis_by_id(analysis_id=analysis_id, session=db_session)
    assert db_analysis is not None
    assert db_analysis.id == analysis_id
    assert db_analysis.user_id == user_id
    assert db_analysis.status == "completed"
    assert db_analysis.success is True
    assert db_analysis.error_message is None
    
    # Check that analysis_issues are created and in the database
    analysis_issues: list[AnalysisIssue] = get_analysis_issues_by_analysis_id(analysis_id=analysis_id, session=db_session)
    assert len(analysis_issues) > 0
    for issue in analysis_issues:
        assert issue.analysis_id == analysis_id
        
    # Cleanup - delete the created analysis issues
    for issue in analysis_issues:
        response = client.delete(
            f"/api/v1/analyses/{analysis_id}/issues/{issue.id}"
        )
    
        # Assert that the issue was deleted successfully with no return content
        assert response.status_code == 204
        
        # Verify its deleted from the database
        assert get_analysis_issue_by_id(analysis_issue_id=issue.id, session=db_session) is None