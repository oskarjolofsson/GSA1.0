import pytest
from core.infrastructure.AI.google.client import GoogleAnalysisClient
from core.infrastructure.db.repositories.issues import get_all_issues


class TestGoogleAnalysisIntegration:
    """Integration tests for Google Analysis Client with real API calls."""
    
    def test_analyze_video_returns_valid_dict(self, analysis_result):
        """Test that analyze_video completes successfully and returns a valid dictionary."""
        result = analysis_result
        
        # Verify result is a dictionary
        assert isinstance(result, dict), "Result should be a dictionary"
        
        # Verify top-level structure
        assert "metadata" in result, "Missing analysis_metadata"
        assert "issues" in result, "Missing issues"
        assert "success" in result, "Missing success flag"
    
    def test_analyze_video_metadata_structure(self, analysis_result):
        """Test that analysis metadata has correct structure."""
        result = analysis_result
        
        metadata = result["metadata"]
        
        # Verify metadata fields
        assert "camera_view" in metadata, "Missing camera_view"
        assert "club-type" in metadata, "Missing club-type"
        
        # Verify enum values
        assert metadata["camera_view"] in ["unknown", "face_on", "down_the_line"], \
            f"Invalid camera_view: {metadata['camera_view']}"
        assert metadata["club-type"] in ["unknown", "iron", "driver"], \
            f"Invalid club-type: {metadata['club-type']}"
    
    def test_analyze_video_issues_structure(self, analysis_result):
        """Test that issues array has correct structure."""
        result = analysis_result
        
        issues = result["issues"]
        
        # Verify issues is a list
        assert isinstance(issues, list), "Issues should be a list"
        
        # Verify each issue has correct structure
        for i, issue in enumerate(issues):
            assert "issue_id" in issue, f"Issue {i} missing issue_id"
            
            # Verify that issue_id exists and is a non-empty string
            assert isinstance(issue["issue_id"], str) and issue["issue_id"], \
                f"Issue {i} has invalid issue_id: {issue['issue_id']}"
            
            assert "confidence" in issue, f"Issue {i} missing confidence"
            
            # Verify confidence range
            assert 0.0 <= issue["confidence"] <= 1.0, \
                f"Confidence out of range: {issue['confidence']}"
    
    def test_analyze_video_with_user_context(self, analysis_result_with_context):
        """Test analysis with user context parameters."""
        result = analysis_result_with_context
        
        # Verify result structure
        assert isinstance(result, dict), "Result should be a dictionary"
        assert "success" in result, "Missing success flag"
        
    
    def test_analyze_video_success_flag(self, analysis_result):
        """Test that success flag is boolean."""
        result = analysis_result
        
        # Verify success is boolean
        assert isinstance(result["success"], bool), "Success should be a boolean"
    
    def test_analyze_video_constraints(self, analysis_result):
        """Test that analysis respects constraints."""
        result = analysis_result
        
        issues = result["issues"]
        
        # Verify constraint: at most 6 issues
        assert len(issues) <= 6, f"Too many issues: {len(issues)} (max 6)"
        
    def test_analyze_video_issue_ids_exist(self, analysis_result, db_session):
        """Test that issue_ids returned by analysis actually exist in the system."""
        result = analysis_result
        
        db_issues = get_all_issues(db_session)
        db_issue_ids = {str(issue.id) for issue in db_issues}
        
        issues = result["issues"]
        
        for i, issue in enumerate(issues):
            issue_id = issue["issue_id"]
            assert issue_id in db_issue_ids, f"Issue {i} has unknown issue_id: {issue_id}"
            
    def test_non_golf_video_analysis(self, analysis_result_non_golf):
        """Test that analyzing a non-golf video returns success: false."""
        result = analysis_result_non_golf
        
        # Verify success is false
        assert result["success"] == False, "Non-golf video should return success: false"
    

class TestGoogleAnalysisProtocol:
    """Test that GoogleAnalysisClient conforms to AnalysisAI protocol."""
    
    def test_client_implements_protocol(self):
        """Test that client implements the AnalysisAI protocol."""
        from core.infrastructure.AI.ports import AnalysisAI
        
        client = GoogleAnalysisClient()
        
        # Verify client has analyze_video method
        assert hasattr(client, 'analyze_video'), "Client missing analyze_video method"
        assert callable(client.analyze_video), "analyze_video is not callable"
