import pytest
from uuid import UUID
from ...core.services.drill_service import (
    create_drill,
    get_drill_by_id,
    get_drills_by_issue_id,
    update_drill,
    delete_drill,
)
from ...core.services.dtos.drill_service_dto import CreateDrillDTO, UpdateDrillDTO
from ...core.infrastructure.db.repositories.drills import get_drill_by_id as repo_get_drill_by_id
from ...core.infrastructure.db.models.Issue import Issue
from ...core.infrastructure.db.models.IssueDrill import IssueDrill
from ...core.infrastructure.db.repositories.issues import create_issue as repo_create_issue
from ...core.infrastructure.db.repositories.issue_drills import create_issue_drill


class TestCreateDrill:
    """Tests for create_drill function"""

    def test_create_drill_success(self, db_session):
        """Test that create_drill creates a drill with correct fields"""
        # Arrange
        dto = CreateDrillDTO(
            title="Swing Path Drill",
            task="Practice maintaining the correct swing path",
            success_signal="Ball trajectory is consistent",
            fault_indicator="Inconsistent ball flight",
        )

        # Act
        result = create_drill(dto, db_session=db_session)

        # Assert
        assert result is not None
        assert result.title == "Swing Path Drill"
        assert result.task == "Practice maintaining the correct swing path"
        assert result.success_signal == "Ball trajectory is consistent"
        assert result.fault_indicator == "Inconsistent ball flight"
        assert isinstance(result.id, UUID)

        # Verify in database
        drill_in_db = repo_get_drill_by_id(result.id, db_session)
        assert drill_in_db is not None
        assert drill_in_db.title == "Swing Path Drill"


class TestGetDrillById:
    """Tests for get_drill_by_id function"""

    def test_get_drill_by_id_exists(self, db_session):
        """Test getting an existing drill by ID"""
        # Arrange - Create a drill first
        dto = CreateDrillDTO(
            title="Test Drill",
            task="Test task",
            success_signal="Test success",
            fault_indicator="Test fault",
        )
        created_drill = create_drill(dto, db_session=db_session)

        # Act
        result = get_drill_by_id(created_drill.id, db_session=db_session)

        # Assert
        assert result is not None
        assert result.id == created_drill.id
        assert result.title == "Test Drill"

    def test_get_drill_by_id_not_exists(self, db_session):
        """Test getting a non-existent drill returns None"""
        # Arrange
        fake_id = UUID("00000000-0000-0000-0000-000000000000")

        # Act
        result = get_drill_by_id(fake_id, db_session=db_session)

        # Assert
        assert result is None


class TestGetDrillsByIssueId:
    """Tests for get_drills_by_issue_id function"""

    def test_get_drills_by_issue_id_returns_associated_drills(
        self, db_session
    ):
        """Test that get_drills_by_issue_id returns drills linked to an issue"""
        # Arrange - Create an issue
        issue = Issue(
            title="Over the top",
            phase="DOWNSWING",
            current_motion="Steep angle",
            expected_motion="Shallow angle",
        )
        issue = repo_create_issue(issue, db_session)

        # Create drills
        drill1_dto = CreateDrillDTO(
            title="Drill 1",
            task="Task 1",
            success_signal="Success 1",
            fault_indicator="Fault 1",
        )
        drill2_dto = CreateDrillDTO(
            title="Drill 2",
            task="Task 2",
            success_signal="Success 2",
            fault_indicator="Fault 2",
        )
        drill1 = create_drill(drill1_dto, db_session=db_session)
        drill2 = create_drill(drill2_dto, db_session=db_session)

        # Link drills to issue
        issue_drill1 = IssueDrill(issue_id=issue.id, drill_id=drill1.id)
        issue_drill2 = IssueDrill(issue_id=issue.id, drill_id=drill2.id)
        create_issue_drill(issue_drill1, db_session)
        create_issue_drill(issue_drill2, db_session)
        db_session.commit()

        # Act
        result = get_drills_by_issue_id(issue.id, db_session=db_session)

        # Assert
        assert len(result) == 2
        drill_titles = [drill.title for drill in result]
        assert "Drill 1" in drill_titles
        assert "Drill 2" in drill_titles

    def test_get_drills_by_issue_id_returns_empty_list_for_no_drills(
        self, db_session
    ):
        """Test that get_drills_by_issue_id returns empty list when no drills are linked"""
        # Arrange - Create an issue with no drills
        issue = Issue(
            title="Test Issue",
            phase="IMPACT",
        )
        issue = repo_create_issue(issue, db_session)

        # Act
        result = get_drills_by_issue_id(issue.id, db_session=db_session)

        # Assert
        assert result == []


class TestUpdateDrill:
    """Tests for update_drill function"""

    def test_update_drill_partial_update(self, db_session):
        """Test that update_drill only updates provided fields"""
        # Arrange - Create a drill
        dto = CreateDrillDTO(
            title="Original Title",
            task="Original Task",
            success_signal="Original Success",
            fault_indicator="Original Fault",
        )
        created_drill = create_drill(dto, db_session=db_session)

        # Act - Update only title
        update_dto = UpdateDrillDTO(title="Updated Title")
        updated_drill = update_drill(created_drill.id, update_dto, db_session=db_session)

        # Assert
        assert updated_drill is not None
        assert updated_drill.title == "Updated Title"
        assert updated_drill.task == "Original Task"
        assert updated_drill.success_signal == "Original Success"
        assert updated_drill.fault_indicator == "Original Fault"

    def test_update_drill_full_update(self, db_session):
        """Test that update_drill can update all fields"""
        # Arrange - Create a drill
        dto = CreateDrillDTO(
            title="Original Title",
            task="Original Task",
            success_signal="Original Success",
            fault_indicator="Original Fault",
        )
        created_drill = create_drill(dto, db_session=db_session)

        # Act - Update all fields
        update_dto = UpdateDrillDTO(
            title="New Title",
            task="New Task",
            success_signal="New Success",
            fault_indicator="New Fault",
        )
        updated_drill = update_drill(created_drill.id, update_dto, db_session=db_session)

        # Assert
        assert updated_drill is not None
        assert updated_drill.title == "New Title"
        assert updated_drill.task == "New Task"
        assert updated_drill.success_signal == "New Success"
        assert updated_drill.fault_indicator == "New Fault"

    def test_update_drill_not_exists(self, db_session):
        """Test that update_drill returns None for non-existent drill"""
        # Arrange
        fake_id = UUID("00000000-0000-0000-0000-000000000000")
        update_dto = UpdateDrillDTO(title="Updated Title")

        # Act
        result = update_drill(fake_id, update_dto, db_session=db_session)

        # Assert
        assert result is None


class TestDeleteDrill:
    """Tests for delete_drill function"""

    def test_delete_drill_success(self, db_session):
        """Test that delete_drill successfully deletes a drill"""
        # Arrange - Create a drill
        dto = CreateDrillDTO(
            title="To Delete",
            task="Task",
            success_signal="Success",
            fault_indicator="Fault",
        )
        created_drill = create_drill(dto, db_session=db_session)

        # Act
        result = delete_drill(created_drill.id, db_session=db_session)

        # Assert
        assert result is True

        # Verify it's deleted
        drill_in_db = repo_get_drill_by_id(created_drill.id, db_session)
        assert drill_in_db is None

    def test_delete_drill_not_exists(self, db_session):
        """Test that delete_drill returns False for non-existent drill"""
        # Arrange
        fake_id = UUID("00000000-0000-0000-0000-000000000000")

        # Act
        result = delete_drill(fake_id, db_session=db_session)

        # Assert
        assert result is False
