from services.db.models.Issue import Issue
import uuid
from services.db.repositories.issues import (
    create_issue,
    get_issue_by_id,
)
import pytest


class TestIssueCreate:
    """Tests for creating Issue records"""

    def test_create_issue_with_required_fields(self, db_session):
        """Test creating an issue with required fields"""
        issue = Issue(
            title="Hanging Back",
        )

        created = create_issue(issue=issue, session=db_session)

        assert created.id is not None
        assert created.title == "Hanging Back"
        assert created.phase is None
        assert created.severity is None
        assert created.created_at is not None

    def test_create_issue_with_all_fields(self, db_session):
        """Test creating an issue with all fields"""
        issue = Issue(
            title="Early Extension",
            phase="DOWNSWING",
            severity="MAJOR",
            current_motion="Hips move toward ball during downswing",
            expected_motion="Hips should rotate without moving forward",
            swing_effect="Loss of posture and power",
            shot_outcome="Inconsistent contact, blocks and hooks",
        )

        created = create_issue(issue=issue, session=db_session)

        assert created.id is not None
        assert created.title == "Early Extension"
        assert created.phase == "DOWNSWING"
        assert created.severity == "MAJOR"
        assert created.current_motion == "Hips move toward ball during downswing"
        assert created.expected_motion == "Hips should rotate without moving forward"
        assert created.swing_effect == "Loss of posture and power"
        assert created.shot_outcome == "Inconsistent contact, blocks and hooks"

    def test_create_issue_persists_to_database(self, db_session):
        """Test that created issue is persisted to database"""
        issue = Issue(
            title="Over the Top",
            phase="TRANSITION",
            severity="MAJOR",
        )

        create_issue(issue=issue, session=db_session)

        fetched_issue = get_issue_by_id(issue.id, session=db_session)

        assert fetched_issue is not None
        assert fetched_issue.id == issue.id
        assert fetched_issue.title == "Over the Top"


class TestIssueRead:
    """Tests for reading Issue records"""

    def test_get_issue_by_id(self, db_session):
        """Test retrieving an issue by ID"""
        issue = Issue(
            title="Chicken Wing",
            phase="FOLLOW_THROUGH",
        )
        created = create_issue(issue=issue, session=db_session)

        fetched = get_issue_by_id(created.id, session=db_session)

        assert fetched is not None
        assert fetched.id == created.id
        assert fetched.title == "Chicken Wing"

    def test_get_issue_by_id_not_found(self, db_session):
        """Test retrieving a non-existent issue returns None"""
        non_existent_id = uuid.uuid4()

        result = get_issue_by_id(non_existent_id, session=db_session)

        assert result is None


class TestIssueConstraints:
    """Tests for Issue model constraints"""

    def test_issue_id_is_uuid(self, db_session):
        """Test that issue ID is a valid UUID"""
        issue = Issue(
            title="Test Issue",
        )
        created = create_issue(issue=issue, session=db_session)

        assert isinstance(created.id, uuid.UUID)

    def test_issue_created_at_is_set(self, db_session):
        """Test that created_at is automatically set"""
        issue = Issue(
            title="Test Issue",
        )
        created = create_issue(issue=issue, session=db_session)

        assert created.created_at is not None

    def test_valid_phase_values(self, db_session):
        """Test all valid phase values"""
        valid_phases = ["SETUP", "BACKSWING", "TRANSITION", "DOWNSWING", "IMPACT", "FOLLOW_THROUGH"]

        for phase in valid_phases:
            issue = Issue(
                title=f"Test Issue {phase}",
                phase=phase,
            )
            created = create_issue(issue=issue, session=db_session)
            assert created.phase == phase

    def test_valid_severity_values(self, db_session):
        """Test all valid severity values"""
        valid_severities = ["MINOR", "MODERATE", "MAJOR"]

        for severity in valid_severities:
            issue = Issue(
                title=f"Test Issue {severity}",
                severity=severity,
            )
            created = create_issue(issue=issue, session=db_session)
            assert created.severity == severity

    def test_issue_requires_title(self, db_session):
        """Test that title is required"""
        issue = Issue(
            phase="SETUP",
        )

        with pytest.raises(Exception):
            create_issue(issue=issue, session=db_session)
