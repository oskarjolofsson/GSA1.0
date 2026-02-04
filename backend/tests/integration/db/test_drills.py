from ....core.infrastructure.db.models.Drill import Drill
import uuid
from ....core.infrastructure.db.repositories.drills import (
    create_drill,
    get_drill_by_id,
)
import pytest


class TestDrillCreate:
    """Tests for creating Drill records"""

    def test_create_drill_with_required_fields(self, db_session):
        """Test creating a drill with required fields"""
        drill = Drill(
            title="Weight Shift Drill",
            task="Practice shifting weight from trail to lead foot during downswing",
            success_signal="Ball struck cleanly with divot after ball",
            fault_indicator="Ball topped or thin contact",
        )

        created = create_drill(drill=drill, session=db_session)

        assert created.id is not None
        assert created.title == "Weight Shift Drill"
        assert created.task == "Practice shifting weight from trail to lead foot during downswing"
        assert created.success_signal == "Ball struck cleanly with divot after ball"
        assert created.fault_indicator == "Ball topped or thin contact"
        assert created.created_at is not None

    def test_create_drill_persists_to_database(self, db_session):
        """Test that created drill is persisted to database"""
        drill = Drill(
            title="Hip Turn Drill",
            task="Practice rotating hips through impact",
            success_signal="Full hip rotation at finish",
            fault_indicator="Limited hip movement",
        )

        create_drill(drill=drill, session=db_session)

        fetched_drill = get_drill_by_id(drill.id, session=db_session)

        assert fetched_drill is not None
        assert fetched_drill.id == drill.id
        assert fetched_drill.title == "Hip Turn Drill"


class TestDrillRead:
    """Tests for reading Drill records"""

    def test_get_drill_by_id(self, db_session):
        """Test retrieving a drill by ID"""
        drill = Drill(
            title="Alignment Drill",
            task="Practice proper setup alignment",
            success_signal="Club face square to target",
            fault_indicator="Club face open or closed",
        )
        created = create_drill(drill=drill, session=db_session)

        fetched = get_drill_by_id(created.id, session=db_session)

        assert fetched is not None
        assert fetched.id == created.id
        assert fetched.title == "Alignment Drill"

    def test_get_drill_by_id_not_found(self, db_session):
        """Test retrieving a non-existent drill returns None"""
        non_existent_id = uuid.uuid4()

        result = get_drill_by_id(non_existent_id, session=db_session)

        assert result is None


class TestDrillConstraints:
    """Tests for Drill model constraints"""

    def test_drill_id_is_uuid(self, db_session):
        """Test that drill ID is a valid UUID"""
        drill = Drill(
            title="Test Drill",
            task="Test task",
            success_signal="Test success",
            fault_indicator="Test fault",
        )
        created = create_drill(drill=drill, session=db_session)

        assert isinstance(created.id, uuid.UUID)

    def test_drill_created_at_is_set(self, db_session):
        """Test that created_at is automatically set"""
        drill = Drill(
            title="Test Drill",
            task="Test task",
            success_signal="Test success",
            fault_indicator="Test fault",
        )
        created = create_drill(drill=drill, session=db_session)

        assert created.created_at is not None

    def test_drill_requires_title(self, db_session):
        """Test that title is required"""
        drill = Drill(
            task="Test task",
            success_signal="Test success",
            fault_indicator="Test fault",
        )

        with pytest.raises(Exception):
            create_drill(drill=drill, session=db_session)

    def test_drill_requires_task(self, db_session):
        """Test that task is required"""
        drill = Drill(
            title="Test Drill",
            success_signal="Test success",
            fault_indicator="Test fault",
        )

        with pytest.raises(Exception):
            create_drill(drill=drill, session=db_session)

    def test_drill_requires_success_signal(self, db_session):
        """Test that success_signal is required"""
        drill = Drill(
            title="Test Drill",
            task="Test task",
            fault_indicator="Test fault",
        )

        with pytest.raises(Exception):
            create_drill(drill=drill, session=db_session)

    def test_drill_requires_fault_indicator(self, db_session):
        """Test that fault_indicator is required"""
        drill = Drill(
            title="Test Drill",
            task="Test task",
            success_signal="Test success",
        )

        with pytest.raises(Exception):
            create_drill(drill=drill, session=db_session)
