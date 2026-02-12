# tests/api/test_analysis.py
import pytest
from uuid import UUID


class TestAnalysisEndpoints:
    """Simple tests for analysis API endpoints."""

    # Create analysis and check so that we get a valid analysis ID and upload URL
    def test_create_analysis(self, client, test_user):
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
        print(data)
        
        assert response.status_code == 200
        assert data["success"] is True
        assert "analysis_id" in data
        assert "upload_url" in data
        assert isinstance(data["analysis_id"], str)
        assert isinstance(data["upload_url"], str)
        assert len(data["upload_url"]) > 0
        
        
        