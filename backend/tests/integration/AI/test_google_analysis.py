import pytest
from core.infrastructure.AI.google.client import GoogleAnalysisClient


class TestGoogleAnalysisIntegration:
    """Integration tests for Google Analysis Client with real API calls."""
    
    def test_analyze_video_returns_valid_dict(self, analysis_result):
        """Test that analyze_video completes successfully and returns a valid dictionary."""
        result = analysis_result
        
        # Verify result is a dictionary
        assert isinstance(result, dict), "Result should be a dictionary"
        
        # Verify top-level structure
        assert "analysis_metadata" in result, "Missing analysis_metadata"
        assert "issues" in result, "Missing issues"
        assert "key_findings" in result, "Missing key_findings"
        assert "success" in result, "Missing success flag"
        
        print(f"\n✓ Analysis completed successfully")
        print(f"  Success: {result['success']}")
        print(f"  Issues found: {len(result['issues'])}")
        print(f"  Key findings: {len(result['key_findings'])}")
    
    def test_analyze_video_metadata_structure(self, analysis_result):
        """Test that analysis metadata has correct structure."""
        result = analysis_result
        
        metadata = result["analysis_metadata"]
        
        # Verify metadata fields
        assert "model_version" in metadata, "Missing model_version"
        assert "camera_view" in metadata, "Missing camera_view"
        assert "club_type" in metadata, "Missing club_type"
        
        # Verify enum values
        assert metadata["camera_view"] in ["unknown", "face_on", "down_the_line"], \
            f"Invalid camera_view: {metadata['camera_view']}"
        assert metadata["club_type"] in ["unknown", "iron", "driver"], \
            f"Invalid club_type: {metadata['club_type']}"
        
        print(f"\n✓ Metadata structure valid")
        print(f"  Model version: {metadata['model_version']}")
        print(f"  Camera view: {metadata['camera_view']}")
        print(f"  Club type: {metadata['club_type']}")
    
    def test_analyze_video_issues_structure(self, analysis_result):
        """Test that issues array has correct structure."""
        result = analysis_result
        
        issues = result["issues"]
        
        # Verify issues is a list
        assert isinstance(issues, list), "Issues should be a list"
        
        # Verify each issue has correct structure
        for i, issue in enumerate(issues):
            assert "issue_code" in issue, f"Issue {i} missing issue_code"
            assert "title" in issue, f"Issue {i} missing title"
            assert "phase" in issue, f"Issue {i} missing phase"
            assert "confidence" in issue, f"Issue {i} missing confidence"
            assert "explanation" in issue, f"Issue {i} missing explanation"
            assert "drill" in issue, f"Issue {i} missing drill"
            
            # Verify enum values
            assert issue["phase"] in ["SETUP", "BACKSWING", "TRANSITION", "DOWNSWING", "IMPACT", "FOLLOW_THROUGH"], \
                f"Invalid phase: {issue['phase']}"
            
            # Verify confidence range
            assert 0.0 <= issue["confidence"] <= 1.0, \
                f"Confidence out of range: {issue['confidence']}"
            
            # Verify explanation structure
            explanation = issue["explanation"]
            assert "current_motion" in explanation, f"Issue {i} explanation missing current_motion"
            assert "expected_motion" in explanation, f"Issue {i} explanation missing expected_motion"
            assert "swing_effect" in explanation, f"Issue {i} explanation missing swing_effect"
            assert "shot_outcome" in explanation, f"Issue {i} explanation missing shot_outcome"
            
            # Verify drill structure
            drill = issue["drill"]
            assert "drill_code" in drill, f"Issue {i} drill missing drill_code"
            assert "task" in drill, f"Issue {i} drill missing task"
            assert "success_signal" in drill, f"Issue {i} drill missing success_signal"
            assert "fault_indicator" in drill, f"Issue {i} drill missing fault_indicator"
        
        print(f"\n✓ Issues structure valid")
        print(f"  Total issues: {len(issues)}")
        if issues:
            print(f"  First issue: {issues[0]['title']} ({issues[0]['phase']})")
    
    def test_analyze_video_key_findings_structure(self, analysis_result):
        """Test that key_findings array has correct structure."""
        result = analysis_result
        
        key_findings = result["key_findings"]
        
        # Verify key_findings is a list
        assert isinstance(key_findings, list), "Key findings should be a list"
        
        # Verify each finding has correct structure
        for i, finding in enumerate(key_findings):
            assert "issue_code" in finding, f"Finding {i} missing issue_code"
            assert "title" in finding, f"Finding {i} missing title"
            assert "summary" in finding, f"Finding {i} missing summary"
            assert "importance" in finding, f"Finding {i} missing importance"
            assert "focus_tip" in finding, f"Finding {i} missing focus_tip"
            assert "drill" in finding, f"Finding {i} missing drill"
            
            # Verify drill structure
            drill = finding["drill"]
            assert "task" in drill, f"Finding {i} drill missing task"
            assert "success_signal" in drill, f"Finding {i} drill missing success_signal"
            assert "fault_indicator" in drill, f"Finding {i} drill missing fault_indicator"
        
        print(f"\n✓ Key findings structure valid")
        print(f"  Total key findings: {len(key_findings)}")
        if key_findings:
            print(f"  First finding: {key_findings[0]['title']}")
    
    def test_analyze_video_with_user_context(self, analysis_result_with_context):
        """Test analysis with user context parameters."""
        result = analysis_result_with_context
        
        # Verify result structure
        assert isinstance(result, dict), "Result should be a dictionary"
        assert "success" in result, "Missing success flag"
        
        print(f"\n✓ Analysis with user context completed")
        print(f"  Success: {result['success']}")
        print(f"  Issues: {len(result['issues'])}")
    
    def test_analyze_video_success_flag(self, analysis_result):
        """Test that success flag is boolean."""
        result = analysis_result
        
        # Verify success is boolean
        assert isinstance(result["success"], bool), "Success should be a boolean"
        
        print(f"\n✓ Success flag valid: {result['success']}")
    
    def test_analyze_video_constraints(self, analysis_result):
        """Test that analysis respects constraints."""
        result = analysis_result
        
        issues = result["issues"]
        
        # Verify constraint: at most 6 issues
        assert len(issues) <= 6, f"Too many issues: {len(issues)} (max 6)"
        
        print(f"\n✓ Constraints validated")
        print(f"  Total issues: {len(issues)} (max 6)")
    
    def test_analyze_video_key_findings_reference_issues(self, analysis_result):
        """Test that key_findings reference issues."""
        result = analysis_result
        
        issues = result["issues"]
        key_findings = result["key_findings"]
        
        # If there are issues and key findings, verify they reference valid issues
        if issues and key_findings:
            issue_codes = [issue["issue_code"] for issue in issues]
            
            for finding in key_findings:
                assert finding["issue_code"] in issue_codes, \
                    f"Key finding references unknown issue: {finding['issue_code']}"
            
            print(f"\n✓ Key findings reference valid issues")
            print(f"  Total issues: {len(issue_codes)}")
            print(f"  Key findings: {len(key_findings)}")
        else:
            print(f"\n✓ No issues or key findings to validate")


class TestGoogleAnalysisProtocol:
    """Test that GoogleAnalysisClient conforms to AnalysisAI protocol."""
    
    def test_client_implements_protocol(self):
        """Test that client implements the AnalysisAI protocol."""
        from core.infrastructure.AI.ports import AnalysisAI
        
        client = GoogleAnalysisClient()
        
        # Verify client has analyze_video method
        assert hasattr(client, 'analyze_video'), "Client missing analyze_video method"
        assert callable(client.analyze_video), "analyze_video is not callable"
        
        print("\n✓ Client implements AnalysisAI protocol")
