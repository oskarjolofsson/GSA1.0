from ....core.infrastructure.db.models.Issue import Issue
import uuid
from ....core.infrastructure.db.repositories.issues import (
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
            description="Weight stays on trail foot through impact",
        )

        created = create_issue(issue=issue, session=db_session)

        assert created.id is not None
        assert created.title == "Hanging Back"
        assert created.area == "FULL_SWING"
        assert created.kind == "fault"
        assert created.created_at is not None

    def test_create_issue_with_all_fields(self, db_session):
        """Test creating an issue with all fields"""
        issue = Issue(
            title="Early Extension",
            description="Golfer's hips move toward the ball during the downswing",
            area="FULL_SWING",
            kind="fault",
            current_motion="Hips move toward ball during downswing",
            expected_motion="Hips should rotate without moving forward",
            swing_effect="Loss of posture and power",
            shot_outcome="Inconsistent contact, blocks and hooks",
        )

        created = create_issue(issue=issue, session=db_session)

        assert created.id is not None
        assert created.title == "Early Extension"
        assert created.area == "FULL_SWING"
        assert created.kind == "fault"
        assert created.current_motion == "Hips move toward ball during downswing"
        assert created.expected_motion == "Hips should rotate without moving forward"
        assert created.swing_effect == "Loss of posture and power"
        assert created.shot_outcome == "Inconsistent contact, blocks and hooks"
        assert created.description == "Golfer's hips move toward the ball during the downswing"

    def test_create_issue_persists_to_database(self, db_session):
        """Test that created issue is persisted to database"""
        issue = Issue(
            title="Over the Top",
            description="Club moves outside the swing plane on the downswing",
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
            description="Lead elbow bends out away from the body through impact",
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
            description="Placeholder description",
        )
        created = create_issue(issue=issue, session=db_session)

        assert isinstance(created.id, uuid.UUID)

    def test_issue_created_at_is_set(self, db_session):
        """Test that created_at is automatically set"""
        issue = Issue(
            title="Test Issue",
            description="Placeholder description",
        )
        created = create_issue(issue=issue, session=db_session)

        assert created.created_at is not None

    def test_valid_area_values(self, db_session):
        """Test all valid area values"""
        valid_areas = ["FULL_SWING", "CHIPPING", "PUTTING", "BUNKER", "PITCHING"]

        for area in valid_areas:
            issue = Issue(
                title=f"Test Issue {area}",
                description=f"Placeholder description for {area}",
                area=area,
            )
            created = create_issue(issue=issue, session=db_session)
            assert created.area == area

    def test_issue_requires_title(self, db_session):
        """Test that title is required"""
        issue = Issue(
            description="Placeholder description",
        )

        with pytest.raises(Exception):
            create_issue(issue=issue, session=db_session)
