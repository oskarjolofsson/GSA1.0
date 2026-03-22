import pytest
from uuid import UUID, uuid4
from sqlalchemy import text
from core.services.feedback_service import (
    create_feedback,
    get_all_feedback,
)
from core.services.dtos.feedback_service_dto import CreateFeedbackDTO
from core.infrastructure.db.repositories.feedback import (
    get_feedback_by_id as repo_get_feedback_by_id,
)


@pytest.fixture(scope="function")
def test_user_2(db_session):
    """Function-scoped second test user for multi-user tests."""
    user_id = uuid4()
    db_session.execute(
        text("INSERT INTO auth.users (id) VALUES (:id)"),
        {"id": user_id},
    )
    db_session.flush()
    return user_id


class TestCreateFeedback:
    """Tests for create_feedback function"""

    def test_create_feedback_success(self, db_session, test_user):
        """Test that create_feedback creates a feedback entry with correct fields"""
        # Arrange
        dto = CreateFeedbackDTO(
            user_id=test_user["user_id"],
            rating=3,
            comments="Great app! Very helpful for improving my golf swing.",
        )

        # Act
        result = create_feedback(dto, db_session=db_session)

        # Assert
        assert result is not None
        assert result.user_id == test_user["user_id"]
        assert result.rating == 3
        assert result.comments == "Great app! Very helpful for improving my golf swing."
        assert isinstance(result.id, UUID)
        assert result.created_at is not None

        # Verify in database
        feedback_in_db = repo_get_feedback_by_id(
            str(result.id), db_session
        )
        assert feedback_in_db is not None
        assert feedback_in_db.rating == 3

    def test_create_feedback_rating_1(self, db_session, test_user):
        """Test creating feedback with rating 1"""
        # Arrange
        dto = CreateFeedbackDTO(
            user_id=test_user["user_id"],
            rating=1,
            comments="Needs improvement",
        )

        # Act
        result = create_feedback(dto, db_session=db_session)

        # Assert
        assert result.rating == 1


class TestGetAllFeedback:
    """Tests for get_all_feedback function"""

    def test_get_all_feedback_returns_all_entries(
        self, db_session, test_user
    ):
        """Test that get_all_feedback returns all feedback entries"""
        # Arrange - Create multiple feedback entries
        dto1 = CreateFeedbackDTO(
            user_id=test_user["user_id"],
            rating=3,
            comments="Feedback 1",
        )
        dto2 = CreateFeedbackDTO(
            user_id=test_user["user_id"],
            rating=2,
            comments="Feedback 2",
        )
        create_feedback(dto1, db_session=db_session)
        create_feedback(dto2, db_session=db_session)

        # Act
        result = get_all_feedback(limit=100, db_session=db_session)

        # Assert
        assert len(result) >= 2
        comments = [fb.comments for fb in result]
        assert "Feedback 1" in comments
        assert "Feedback 2" in comments

    def test_get_all_feedback_respects_limit(
        self, db_session, test_user
    ):
        """Test that get_all_feedback respects the limit parameter"""
        # Arrange - Create 5 feedback entries
        for i in range(5):
            dto = CreateFeedbackDTO(
                user_id=test_user["user_id"],
                rating=2,
                comments=f"Feedback {i}",
            )
            create_feedback(dto, db_session=db_session)

        # Act
        result = get_all_feedback(limit=3, db_session=db_session)

        # Assert
        assert len(result) <= 3

