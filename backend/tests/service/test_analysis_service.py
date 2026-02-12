import pytest
from datetime import timedelta
from ...core.services.analysis_service import (
    create_analysis, 
    get_analysis_by_id as get_analysis_by_id_service,
    get_analyses_by_user_id,
    get_analysis_issues,
    delete_analysis_issue,
    delete_analysis,
)
from ...core.services.dtos.analysis_service_dto import CreateAnalysisDTO, RunAnalysisDTO
from ...core.infrastructure.db.repositories.analysis import get_analysis_by_id
from ...core.infrastructure.db.repositories.videos import get_video_by_id

from ...core.infrastructure.db.repositories.analysis_issues import get_analysis_issues_by_analysis_id


class TestCreateAnalysis:
    """Tests for create_analysis function"""

    def test_create_analysis_creates_video_record(self, db_session, test_user):
        """Test that create_analysis creates a video record with correct fields"""
        # Arrange
        dto = CreateAnalysisDTO(
            user_id=test_user,
            model="v1.0",
            start_time=timedelta(seconds=5),
            end_time=timedelta(seconds=15),
        )

        # Act
        result = create_analysis(dto, db_session
)

        # Assert - Verify analysis was created
        analysis = get_analysis_by_id(result["analysis_id"], session=db_session
)
        assert analysis is not None

        # Verify video was created with correct fields
        video = get_video_by_id(analysis.video_id, session=db_session
)
        assert video is not None
        assert video.user_id == test_user
        assert video.start_time == timedelta(seconds=5)
        assert video.end_time == timedelta(seconds=15)
        assert video.video_key == f"videos/{video.id}"

    def test_create_analysis_creates_analysis_record(self, db_session, test_user):
        """Test that create_analysis creates an analysis record with correct fields"""
        # Arrange
        dto = CreateAnalysisDTO(
            user_id=test_user,
            model="v2.0",
            start_time=timedelta(seconds=10),
            end_time=timedelta(seconds=20),
        )

        # Act
        result = create_analysis(dto, db_session
)

        # Assert
        analysis = get_analysis_by_id(result["analysis_id"], session=db_session
)
        assert analysis is not None
        assert analysis.user_id == test_user
        assert analysis.model_version == "v2.0"
        assert analysis.video_id is not None

    def test_create_analysis_returns_correct_values(self, db_session, test_user):
        """Test that create_analysis returns analysis_id and upload_url"""
        # Arrange
        dto = CreateAnalysisDTO(
            user_id=test_user,
            model="v1.0",
            start_time=timedelta(seconds=0),
            end_time=timedelta(seconds=10),
        )

        # Act
        result = create_analysis(dto, db_session)

        # Assert
        assert "analysis_id" in result
        assert "upload_url" in result
        assert result["analysis_id"] is not None
        assert result["upload_url"] is not None
        assert isinstance(result["upload_url"], str)
        assert len(result["upload_url"]) > 0

    def test_create_analysis_video_key_matches_video_id(self, db_session, test_user):
        """Test that video_key is set to videos/{video.id}"""
        # Arrange
        dto = CreateAnalysisDTO(
            user_id=test_user,
            model="v1.0",
            start_time=timedelta(seconds=0),
            end_time=timedelta(seconds=5),
        )

        # Act
        result = create_analysis(dto, db_session=db_session)

        # Assert
        analysis = get_analysis_by_id(result["analysis_id"], session=db_session)
        video = get_video_by_id(analysis.video_id, session=db_session)
        
        assert video.video_key == f"videos/{video.id}"

    def test_create_analysis_links_video_to_analysis(self, db_session, test_user):
        """Test that the created video is properly linked to the analysis"""
        # Arrange
        dto = CreateAnalysisDTO(
            user_id=test_user,
            model="v1.0",
            start_time=timedelta(seconds=2),
            end_time=timedelta(seconds=8),
        )

        # Act
        result = create_analysis(dto, db_session=db_session)

        # Assert
        analysis = get_analysis_by_id(result["analysis_id"], session=db_session)
        video = get_video_by_id(analysis.video_id, session=db_session)
        
        assert analysis.video_id == video.id


class TestRunAnalysis:
    def test_run_analysis_updates_analysis_status(
        self,
        shared_db_session
,
        completed_analysis_shared,
    ):
        analysis = get_analysis_by_id(
            completed_analysis_shared,
            session=shared_db_session
    ,
        )
        assert analysis.status == "completed", f"Expected analysis status to be 'completed', got '{analysis.status}'"
        assert analysis.success is True, "Analysis did not complete successfully."
        assert analysis.error_message is None, f"Unexpected error message: {analysis.error_message}"

    def test_run_analysis_creates_analysis_issues(
        self,
        shared_db_session
,
        completed_analysis_shared,
    ):
        analysis_issues = get_analysis_issues_by_analysis_id(
            completed_analysis_shared,
            session=shared_db_session
    ,
        )

        assert len(analysis_issues) > 0
        for ai in analysis_issues:
            assert ai.analysis_id == completed_analysis_shared
            assert ai.issue_id is not None

    def test_analysis_crud_operations(
        self,
        shared_db_session
,
        completed_analysis_shared,
        shared_test_user,
    ):
        """Test get, list, and delete operations on analyses and analysis issues"""
        # Test get_analysis_by_id
        analysis_dto = get_analysis_by_id_service(completed_analysis_shared, db_session=shared_db_session)
        
        assert analysis_dto is not None
        assert analysis_dto.analysis_id == completed_analysis_shared
        assert analysis_dto.user_id == shared_test_user
        assert analysis_dto.status == "completed"
        
        # Test get_analyses_by_user_id
        user_analyses = get_analyses_by_user_id(shared_test_user, db_session=shared_db_session)
        assert len(user_analyses) > 0
        analysis_ids = [a.analysis_id for a in user_analyses]
        assert completed_analysis_shared in analysis_ids
        
        # Test get_analysis_issues
        issues = get_analysis_issues(completed_analysis_shared, db_session=shared_db_session)
        assert len(issues) > 0
        first_issue_id = issues[0].analysis_issue_id
        
        # Test delete_analysis_issue
        delete_analysis_issue(first_issue_id, db_session=shared_db_session)
        remaining_issues = get_analysis_issues(completed_analysis_shared, db_session=shared_db_session)
        assert len(remaining_issues) == len(issues) - 1
        remaining_issue_ids = [i.analysis_issue_id for i in remaining_issues]
        assert first_issue_id not in remaining_issue_ids
        
        # Test delete_analysis
        delete_analysis(completed_analysis_shared, db_session=shared_db_session)
        analysis_in_db = get_analysis_by_id(completed_analysis_shared, session=shared_db_session)
        assert analysis_in_db is None
