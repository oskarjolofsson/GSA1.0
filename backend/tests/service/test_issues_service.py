import pytest
from uuid import UUID
from ...core.services.issues_service import (
    create_issue,
    get_issue_by_id,
    get_all_issues,
    get_issues_by_analysis_id,
    get_issues_by_drill_id,
    update_issue,
    delete_issue,
)
from ...core.services.dtos.issues_service_dto import CreateIssueDTO, UpdateIssueDTO
from ...core.infrastructure.db.repositories.issues import (
    get_issue_by_id as repo_get_issue_by_id,
)
from ...core.infrastructure.db.models.Analysis import Analysis
from ...core.infrastructure.db.models.Video import Video
from ...core.infrastructure.db.models.Drill import Drill
from ...core.infrastructure.db.models.AnalysisIssue import AnalysisIssue
from ...core.infrastructure.db.models.IssueDrill import IssueDrill
from ...core.infrastructure.db.repositories.analysis import create_analysis as repo_create_analysis
from ...core.infrastructure.db.repositories.videos import create_video as repo_create_video
from ...core.infrastructure.db.repositories.drills import create_drill as repo_create_drill
from ...core.infrastructure.db.repositories.analysis_issues import create_analysis_issue
from ...core.infrastructure.db.repositories.issue_drills import create_issue_drill


class TestCreateIssue:
    """Tests for create_issue function"""

    def test_create_issue_with_all_fields(self, db_session):
        """Test that create_issue creates an issue with all fields"""
        # Arrange
        dto = CreateIssueDTO(
            title="Over the top swing",
            phase="DOWNSWING",
            current_motion="Steep angle of attack",
            expected_motion="Shallow angle of attack",
            swing_effect="Loss of distance",
            shot_outcome="Pull or slice",
        )

        # Act
        result = create_issue(dto, db_session=db_session)

        # Assert
        assert result is not None
        assert result.title == "Over the top swing"
        assert result.phase == "DOWNSWING"
        assert result.current_motion == "Steep angle of attack"
        assert result.expected_motion == "Shallow angle of attack"
        assert result.swing_effect == "Loss of distance"
        assert result.shot_outcome == "Pull or slice"
        assert isinstance(result.id, UUID)

        # Verify in database
        issue_in_db = repo_get_issue_by_id(result.id, db_session)
        assert issue_in_db is not None
        assert issue_in_db.title == "Over the top swing"

    def test_create_issue_with_minimal_fields(self, db_session):
        """Test that create_issue works with only required fields"""
        # Arrange
        dto = CreateIssueDTO(title="Minimal Issue")

        # Act
        result = create_issue(dto, db_session=db_session)

        # Assert
        assert result is not None
        assert result.title == "Minimal Issue"
        assert result.phase is None
        assert result.current_motion is None


class TestGetIssueById:
    """Tests for get_issue_by_id function"""

    def test_get_issue_by_id_exists(self, db_session):
        """Test getting an existing issue by ID"""
        # Arrange - Create an issue first
        dto = CreateIssueDTO(
            title="Test Issue",
            phase="IMPACT",
        )
        created_issue = create_issue(dto, db_session=db_session)

        # Act
        result = get_issue_by_id(created_issue.id, db_session=db_session)

        # Assert
        assert result is not None
        assert result.id == created_issue.id
        assert result.title == "Test Issue"
        assert result.phase == "IMPACT"

    def test_get_issue_by_id_not_exists(self, db_session):
        """Test getting a non-existent issue returns None"""
        # Arrange
        fake_id = UUID("00000000-0000-0000-0000-000000000000")

        # Act
        result = get_issue_by_id(fake_id, db_session=db_session)

        # Assert
        assert result is None


class TestGetAllIssues:
    """Tests for get_all_issues function"""

    def test_get_all_issues_returns_all_issues(self, db_session):
        """Test that get_all_issues returns all issues"""
        # Arrange - Create multiple issues
        dto1 = CreateIssueDTO(title="Issue 1")
        dto2 = CreateIssueDTO(title="Issue 2")
        create_issue(dto1, db_session=db_session)
        create_issue(dto2, db_session=db_session)

        # Act
        result = get_all_issues(db_session=db_session)

        # Assert
        assert len(result) >= 2
        titles = [issue.title for issue in result]
        assert "Issue 1" in titles
        assert "Issue 2" in titles


class TestGetIssuesByAnalysisId:
    """Tests for get_issues_by_analysis_id function"""

    def test_get_issues_by_analysis_id_returns_associated_issues(
        self, db_session, test_user
    ):
        """Test that get_issues_by_analysis_id returns issues linked to an analysis"""
        # Arrange - Create a video and analysis
        video = Video(user_id=test_user["user_id"])
        video = repo_create_video(video, db_session)

        analysis = Analysis(
            user_id=test_user["user_id"],
            video_id=video.id,
            model_version="v1.0",
            status="completed",
        )
        analysis = repo_create_analysis(analysis, db_session)

        # Create issues
        issue1_dto = CreateIssueDTO(title="Issue 1", phase="BACKSWING")
        issue2_dto = CreateIssueDTO(title="Issue 2", phase="DOWNSWING")
        issue1 = create_issue(issue1_dto, db_session=db_session)
        issue2 = create_issue(issue2_dto, db_session=db_session)

        # Link issues to analysis
        analysis_issue1 = AnalysisIssue(
            analysis_id=analysis.id,
            issue_id=issue1.id,
            confidence=0.9,
        )
        analysis_issue2 = AnalysisIssue(
            analysis_id=analysis.id,
            issue_id=issue2.id,
            confidence=0.85,
        )
        create_analysis_issue(analysis_issue1, db_session)
        create_analysis_issue(analysis_issue2, db_session)
        db_session.commit()

        # Act
        result = get_issues_by_analysis_id(analysis.id, db_session=db_session)

        # Assert
        assert len(result) == 2
        issue_titles = [issue.title for issue in result]
        assert "Issue 1" in issue_titles
        assert "Issue 2" in issue_titles


class TestGetIssuesByDrillId:
    """Tests for get_issues_by_drill_id function"""

    def test_get_issues_by_drill_id_returns_associated_issues(
        self, db_session
    ):
        """Test that get_issues_by_drill_id returns issues linked to a drill"""
        # Arrange - Create a drill
        drill = Drill(
            title="Practice Drill",
            task="Work on swing plane",
            success_signal="Consistent contact",
            fault_indicator="Thin shots",
        )
        drill = repo_create_drill(drill, db_session)

        # Create issues
        issue1_dto = CreateIssueDTO(title="Issue 1")
        issue2_dto = CreateIssueDTO(title="Issue 2")
        issue1 = create_issue(issue1_dto, db_session=db_session)
        issue2 = create_issue(issue2_dto, db_session=db_session)

        # Link issues to drill
        issue_drill1 = IssueDrill(issue_id=issue1.id, drill_id=drill.id)
        issue_drill2 = IssueDrill(issue_id=issue2.id, drill_id=drill.id)
        create_issue_drill(issue_drill1, db_session)
        create_issue_drill(issue_drill2, db_session)
        db_session.commit()

        # Act
        result = get_issues_by_drill_id(drill.id, db_session=db_session)

        # Assert
        assert len(result) == 2
        issue_titles = [issue.title for issue in result]
        assert "Issue 1" in issue_titles
        assert "Issue 2" in issue_titles


class TestUpdateIssue:
    """Tests for update_issue function"""

    def test_update_issue_partial_update(self, db_session):
        """Test that update_issue only updates provided fields"""
        # Arrange - Create an issue
        dto = CreateIssueDTO(
            title="Original Title",
            phase="BACKSWING",
            current_motion="Original motion",
            expected_motion="Original expected",
        )
        created_issue = create_issue(dto, db_session=db_session)

        # Act - Update only title and phase
        update_dto = UpdateIssueDTO(
            title="Updated Title",
            phase="DOWNSWING",
        )
        updated_issue = update_issue(created_issue.id, update_dto, db_session=db_session)

        # Assert
        assert updated_issue is not None
        assert updated_issue.title == "Updated Title"
        assert updated_issue.phase == "DOWNSWING"
        assert updated_issue.current_motion == "Original motion"
        assert updated_issue.expected_motion == "Original expected"

    def test_update_issue_full_update(self, db_session):
        """Test that update_issue can update all fields"""
        # Arrange - Create an issue
        dto = CreateIssueDTO(
            title="Original",
            phase="SETUP",
            current_motion="Original current",
            expected_motion="Original expected",
            swing_effect="Original effect",
            shot_outcome="Original outcome",
        )
        created_issue = create_issue(dto, db_session=db_session)

        # Act - Update all fields
        update_dto = UpdateIssueDTO(
            title="New Title",
            phase="IMPACT",
            current_motion="New current",
            expected_motion="New expected",
            swing_effect="New effect",
            shot_outcome="New outcome",
        )
        updated_issue = update_issue(created_issue.id, update_dto, db_session=db_session)

        # Assert
        assert updated_issue is not None
        assert updated_issue.title == "New Title"
        assert updated_issue.phase == "IMPACT"
        assert updated_issue.current_motion == "New current"
        assert updated_issue.expected_motion == "New expected"
        assert updated_issue.swing_effect == "New effect"
        assert updated_issue.shot_outcome == "New outcome"

    def test_update_issue_not_exists(self, db_session):
        """Test that update_issue returns None for non-existent issue"""
        # Arrange
        fake_id = UUID("00000000-0000-0000-0000-000000000000")
        update_dto = UpdateIssueDTO(title="Updated Title")

        # Act
        result = update_issue(fake_id, update_dto, db_session=db_session)

        # Assert
        assert result is None


class TestDeleteIssue:
    """Tests for delete_issue function"""

    def test_delete_issue_success(self, db_session):
        """Test that delete_issue successfully deletes an issue"""
        # Arrange - Create an issue
        dto = CreateIssueDTO(title="To Delete")
        created_issue = create_issue(dto, db_session=db_session)

        # Act
        result = delete_issue(created_issue.id, db_session=db_session)

        # Assert
        assert result is True

        # Verify it's deleted
        issue_in_db = repo_get_issue_by_id(created_issue.id, db_session)
        assert issue_in_db is None

    def test_delete_issue_not_exists(self, db_session):
        """Test that delete_issue returns False for non-existent issue"""
        # Arrange
        fake_id = UUID("00000000-0000-0000-0000-000000000000")

        # Act
        result = delete_issue(fake_id, db_session=db_session)

        # Assert
        assert result is False
