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
    get_all_issues as repo_get_all_issues,
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

from core.services import exceptions


class TestCreateIssue:
    """Tests for create_issue function"""

    def test_create_issue_with_all_fields(self, db_session):
        """Test that create_issue creates an issue with all fields"""
        # Arrange
        dto = CreateIssueDTO(
            title="Over the top swing",
            description="Club moves outside the swing plane on the downswing",
            area="CHIPPING",
            kind="skill",
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
        assert result.area == "CHIPPING"
        assert result.kind == "skill"
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
        dto = CreateIssueDTO(title="Minimal Issue", description="Minimal issue description")

        # Act
        result = create_issue(dto, db_session=db_session)

        # Assert
        assert result is not None
        assert result.title == "Minimal Issue"
        assert result.area == "FULL_SWING"
        assert result.kind == "fault"
        assert result.current_motion is None


class TestGetIssueById:
    """Tests for get_issue_by_id function"""

    def test_get_issue_by_id_exists(self, db_session, test_user):
        """Test getting an existing issue by ID"""
        # Arrange - Create an issue first
        dto = CreateIssueDTO(
            title="Test Issue",
            description="Test issue description",
            area="PUTTING",
        )
        created_issue = create_issue(dto, db_session=db_session)

        # Act
        result = get_issue_by_id(created_issue.id, user_id=test_user["user_id"], db_session=db_session)

        # Assert
        assert result is not None
        assert result.id == created_issue.id
        assert result.title == "Test Issue"
        assert result.area == "PUTTING"

    def test_get_issue_by_id_not_exists(self, db_session, test_user):
        """Test getting a non-existent issue returns None"""
        # Arrange
        fake_id = UUID("00000000-0000-0000-0000-000000000000")

        # Act
        with pytest.raises(exceptions.NotFoundException):
            result = get_issue_by_id(fake_id, user_id=test_user["user_id"], db_session=db_session)



class TestGetAllIssues:
    """Tests for get_all_issues function"""

    def test_get_all_issues_returns_all_issues(self, db_session, test_user):
        """Test that get_all_issues returns all issues"""
        # Arrange - Create multiple issues
        dto1 = CreateIssueDTO(title="Issue 1", description="Description 1")
        dto2 = CreateIssueDTO(title="Issue 2", description="Description 2")
        create_issue(dto1, db_session=db_session)
        create_issue(dto2, db_session=db_session)

        # Act
        result = get_all_issues(user_id=test_user["user_id"], db_session=db_session)

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
        issue1_dto = CreateIssueDTO(title="Issue 1", description="Description 1")
        issue2_dto = CreateIssueDTO(title="Issue 2", description="Description 2")
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
        db_session.flush()

        # Act
        result = get_issues_by_analysis_id(analysis_id=analysis.id, user_id=test_user["user_id"], db_session=db_session)

        # Assert
        assert len(result) == 2
        issue_titles = [issue.title for issue in result]
        assert "Issue 1" in issue_titles
        assert "Issue 2" in issue_titles


class TestGetIssuesByDrillId:
    """Tests for get_issues_by_drill_id function"""

    def test_get_issues_by_drill_id_returns_associated_issues(
        self, db_session, test_user
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
        issue1_dto = CreateIssueDTO(title="Issue 1", description="Description 1")
        issue2_dto = CreateIssueDTO(title="Issue 2", description="Description 2")
        issue1 = create_issue(issue1_dto, db_session=db_session)
        issue2 = create_issue(issue2_dto, db_session=db_session)

        # Link issues to drill
        issue_drill1 = IssueDrill(issue_id=issue1.id, drill_id=drill.id)
        issue_drill2 = IssueDrill(issue_id=issue2.id, drill_id=drill.id)
        create_issue_drill(issue_drill1, db_session)
        create_issue_drill(issue_drill2, db_session)
        db_session.flush()

        # Act
        result = get_issues_by_drill_id(drill_id=drill.id, user_id=test_user["user_id"], db_session=db_session)

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
            description="Original description",
            area="FULL_SWING",
            current_motion="Original motion",
            expected_motion="Original expected",
        )
        created_issue = create_issue(dto, db_session=db_session)

        # Act - Update only title and area
        update_dto = UpdateIssueDTO(
            title="Updated Title",
            area="BUNKER",
        )
        updated_issue = update_issue(created_issue.id, update_dto, db_session=db_session)

        # Assert
        assert updated_issue is not None
        assert updated_issue.title == "Updated Title"
        assert updated_issue.area == "BUNKER"
        assert updated_issue.current_motion == "Original motion"
        assert updated_issue.expected_motion == "Original expected"

    def test_update_issue_full_update(self, db_session):
        """Test that update_issue can update all fields"""
        # Arrange - Create an issue
        dto = CreateIssueDTO(
            title="Original",
            description="Original description",
            area="FULL_SWING",
            current_motion="Original current",
            expected_motion="Original expected",
            swing_effect="Original effect",
            shot_outcome="Original outcome",
        )
        created_issue = create_issue(dto, db_session=db_session)

        # Act - Update all fields
        update_dto = UpdateIssueDTO(
            title="New Title",
            description="New description",
            area="PITCHING",
            current_motion="New current",
            expected_motion="New expected",
            swing_effect="New effect",
            shot_outcome="New outcome",
        )
        updated_issue = update_issue(created_issue.id, update_dto, db_session=db_session)

        # Assert
        assert updated_issue is not None
        assert updated_issue.title == "New Title"
        assert updated_issue.description == "New description"
        assert updated_issue.area == "PITCHING"
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
        with pytest.raises(exceptions.NotFoundException):
            result = update_issue(fake_id, update_dto, db_session=db_session)

class TestDeleteIssue:
    """Tests for delete_issue function"""

    def test_delete_issue_success(self, db_session):
        """Test that delete_issue successfully deletes an issue"""
        # Arrange - Create an issue
        dto = CreateIssueDTO(title="To Delete", description="Issue to delete")
        created_issue = create_issue(dto, db_session=db_session)
        
        # Verify it's created
        issue_in_db_before = repo_get_issue_by_id(created_issue.id, db_session)
        
        assert issue_in_db_before is not None

        # Act
        delete_issue(created_issue.id, db_session=db_session)

        # Verify it's deleted
        issues_in_db = repo_get_all_issues(db_session)
        issue_ids = [issue.id for issue in issues_in_db]
        assert created_issue.id not in issue_ids, "Deleted issue should not be in the database anymore"
        

    def test_delete_issue_not_exists(self, db_session, test_user):
        """Test that delete_issue returns False for non-existent issue"""
        # Arrange
        fake_id = UUID("00000000-0000-0000-0000-000000000000")
        
        all_issues_before = get_all_issues(user_id=test_user["user_id"], db_session=db_session)

        with pytest.raises(exceptions.NotFoundException):
            delete_issue(fake_id, db_session=db_session)
            
        all_issues_after = get_all_issues(user_id=test_user["user_id"], db_session=db_session)
        assert len(all_issues_before) == len(all_issues_after), "No issues should be deleted when trying to delete a non-existent issue"
            
        


class TestIssueTags:
    """Goal/miss tags on create, read and update.

    Covers the three-state update semantics (None keeps, [] clears, list replaces)
    and the strict validation applied on admin paths.
    """

    def test_create_persists_multiple_misses(self, db_session, test_user):
        """One issue can carry several misses at once."""
        dto = CreateIssueDTO(
            title="Over the top",
            description="Steep out-to-in path",
            misses=["SLICE", "PULL"],
            goals=["STRAIGHTER", "BIG_MISS"],
        )

        created = create_issue(dto, db_session=db_session)

        assert sorted(created.misses) == ["PULL", "SLICE"]
        assert sorted(created.goals) == ["BIG_MISS", "STRAIGHTER"]

    def test_create_normalizes_case_and_deduplicates(self, db_session):
        dto = CreateIssueDTO(
            title="Casing",
            description="d",
            misses=["slice", "SLICE", " pull "],
            goals=["contact"],
        )

        created = create_issue(dto, db_session=db_session)

        assert sorted(created.misses) == ["PULL", "SLICE"]
        assert created.goals == ["CONTACT"]

    def test_create_with_no_tags_yields_empty_lists(self, db_session):
        created = create_issue(
            CreateIssueDTO(title="Untagged", description="d"), db_session=db_session
        )

        assert created.misses == []
        assert created.goals == []

    def test_create_rejects_unknown_miss(self, db_session):
        """Admin paths reject unknown tags rather than dropping them."""
        dto = CreateIssueDTO(title="Bad tag", description="d", misses=["BANANA"])

        with pytest.raises(exceptions.ValidationException):
            create_issue(dto, db_session=db_session)

    def test_create_rejects_unknown_goal(self, db_session):
        dto = CreateIssueDTO(title="Bad goal", description="d", goals=["VIBES"])

        with pytest.raises(exceptions.ValidationException):
            create_issue(dto, db_session=db_session)

    def test_create_rejects_unknown_area(self, db_session):
        """Caught in the service, so it never reaches the CHECK constraint."""
        dto = CreateIssueDTO(title="Bad area", description="d", area="MOON")

        with pytest.raises(exceptions.ValidationException):
            create_issue(dto, db_session=db_session)

    def test_get_by_id_returns_tags(self, db_session, test_user):
        created = create_issue(
            CreateIssueDTO(
                title="Readback", description="d", misses=["FAT"], goals=["CONTACT"]
            ),
            db_session=db_session,
        )

        fetched = get_issue_by_id(
            created.id, user_id=test_user["user_id"], db_session=db_session
        )

        assert fetched.misses == ["FAT"]
        assert fetched.goals == ["CONTACT"]

    def test_update_replaces_the_miss_set(self, db_session):
        """Updating misses replaces the set rather than adding to it."""
        created = create_issue(
            CreateIssueDTO(
                title="Replace me", description="d", misses=["SLICE", "PULL"]
            ),
            db_session=db_session,
        )

        updated = update_issue(
            created.id, UpdateIssueDTO(misses=["HOOK"]), db_session=db_session
        )

        assert updated.misses == ["HOOK"]

    def test_update_replaces_the_goal_set(self, db_session):
        created = create_issue(
            CreateIssueDTO(
                title="Replace goals", description="d", goals=["CONTACT", "DISTANCE"]
            ),
            db_session=db_session,
        )

        updated = update_issue(
            created.id, UpdateIssueDTO(goals=["PUTTING"]), db_session=db_session
        )

        assert updated.goals == ["PUTTING"]

    def test_update_with_empty_list_clears_tags(self, db_session):
        """An explicit [] deletes the tag rows."""
        created = create_issue(
            CreateIssueDTO(
                title="Clear me",
                description="d",
                misses=["SLICE"],
                goals=["STRAIGHTER"],
            ),
            db_session=db_session,
        )

        updated = update_issue(
            created.id, UpdateIssueDTO(misses=[], goals=[]), db_session=db_session
        )

        assert updated.misses == []
        assert updated.goals == []

    def test_update_with_none_leaves_tags_untouched(self, db_session):
        """Updating only the title leaves tags alone. None and [] must stay distinct."""
        created = create_issue(
            CreateIssueDTO(
                title="Keep tags",
                description="d",
                misses=["THIN"],
                goals=["CONTACT"],
            ),
            db_session=db_session,
        )

        updated = update_issue(
            created.id, UpdateIssueDTO(title="New title"), db_session=db_session
        )

        assert updated.title == "New title"
        assert updated.misses == ["THIN"]
        assert updated.goals == ["CONTACT"]

    def test_update_can_set_tags_on_a_previously_untagged_issue(self, db_session):
        created = create_issue(
            CreateIssueDTO(title="Was untagged", description="d"), db_session=db_session
        )

        updated = update_issue(
            created.id,
            UpdateIssueDTO(misses=["LOW_WEAK"], goals=["DISTANCE"]),
            db_session=db_session,
        )

        assert updated.misses == ["LOW_WEAK"]
        assert updated.goals == ["DISTANCE"]

    def test_update_rejects_unknown_miss(self, db_session):
        created = create_issue(
            CreateIssueDTO(title="Reject update", description="d", misses=["SLICE"]),
            db_session=db_session,
        )

        with pytest.raises(exceptions.ValidationException):
            update_issue(
                created.id, UpdateIssueDTO(misses=["BANANA"]), db_session=db_session
            )

    def test_rejected_update_leaves_existing_tags_intact(self, db_session, test_user):
        """A rejected update leaves the existing tags untouched in-session.

        update_issue validates before calling clear(); the reverse order would strip
        the tags on the way to raising, which matters to any caller that catches the
        exception and keeps using the session.

        Asserts on the live ORM object rather than re-reading: the whole test runs in
        one transaction, so a rollback would undo the create too.
        """
        created = create_issue(
            CreateIssueDTO(
                title="Atomic reject", description="d", misses=["SLICE", "PULL"]
            ),
            db_session=db_session,
        )

        issue_row = repo_get_issue_by_id(created.id, db_session)
        assert sorted(m.miss for m in issue_row.misses) == ["PULL", "SLICE"]

        with pytest.raises(exceptions.ValidationException):
            update_issue(
                created.id,
                UpdateIssueDTO(misses=["HOOK", "BANANA"]),
                db_session=db_session,
            )

        # Same session, same object: the tags were never touched.
        assert sorted(m.miss for m in issue_row.misses) == ["PULL", "SLICE"]
