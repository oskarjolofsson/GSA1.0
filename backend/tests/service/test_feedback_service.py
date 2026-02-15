import pytest
from uuid import UUID, uuid4
from sqlalchemy import text
from ...core.services.feedback_service import (
    create_feedback,
    get_feedback_by_id,
    get_feedback_by_user_id,
    get_all_feedback,
    get_feedback_by_rating,
)
from ...core.services.dtos.feedback_service_dto import CreateFeedbackDTO
from ...core.infrastructure.db.repositories.feedback import (
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


class TestGetFeedbackById:
    """Tests for get_feedback_by_id function"""

    def test_get_feedback_by_id_exists(
        self, db_session, test_user
    ):
        """Test getting an existing feedback by ID"""
        # Arrange - Create feedback first
        dto = CreateFeedbackDTO(
            user_id=test_user["user_id"],
            rating=2,
            comments="Good but could be better",
        )
        created_feedback = create_feedback(dto, db_session=db_session)

        # Act
        result = get_feedback_by_id(created_feedback.id, db_session=db_session)

        # Assert
        assert result is not None
        assert result.id == created_feedback.id
        assert result.rating == 2
        assert result.comments == "Good but could be better"

    def test_get_feedback_by_id_not_exists(self, db_session):
        """Test getting a non-existent feedback returns None"""
        # Arrange
        fake_id = UUID("00000000-0000-0000-0000-000000000000")

        # Act
        result = get_feedback_by_id(fake_id, db_session=db_session)

        # Assert
        assert result is None


class TestGetFeedbackByUserId:
    """Tests for get_feedback_by_user_id function"""

    def test_get_feedback_by_user_id_returns_user_feedback(
        self, db_session, test_user, test_user_2
    ):
        """Test that get_feedback_by_user_id returns all feedback for a user"""
        # Arrange - Create multiple feedback entries for the user
        dto1 = CreateFeedbackDTO(
            user_id=test_user["user_id"],
            rating=3,
            comments="First feedback",
        )
        dto2 = CreateFeedbackDTO(
            user_id=test_user["user_id"],
            rating=2,
            comments="Second feedback",
        )
        create_feedback(dto1, db_session=db_session)
        create_feedback(dto2, db_session=db_session)

        # Create feedback for another user to ensure filtering works
        dto3 = CreateFeedbackDTO(
            user_id=test_user_2,
            rating=1,
            comments="Other user feedback",
        )
        create_feedback(dto3, db_session=db_session)

        # Act
        result = get_feedback_by_user_id(test_user["user_id"], db_session=db_session)

        # Assert
        assert len(result) == 2
        comments = [fb.comments for fb in result]
        assert "First feedback" in comments
        assert "Second feedback" in comments
        assert "Other user feedback" not in comments

    def test_get_feedback_by_user_id_returns_empty_list_for_no_feedback(
        self, db_session, test_user
    ):
        """Test that get_feedback_by_user_id returns empty list when user has no feedback"""
        # Act
        result = get_feedback_by_user_id(test_user["user_id"], db_session=db_session)

        # Assert
        assert result == []


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


class TestGetFeedbackByRating:
    """Tests for get_feedback_by_rating function"""

    def test_get_feedback_by_rating_filters_correctly(
        self, db_session, test_user
    ):
        """Test that get_feedback_by_rating returns only feedback with specified rating"""
        # Arrange - Create feedback with different ratings
        dto_rating_3 = CreateFeedbackDTO(
            user_id=test_user["user_id"],
            rating=3,
            comments="Excellent",
        )
        dto_rating_2 = CreateFeedbackDTO(
            user_id=test_user["user_id"],
            rating=2,
            comments="Good",
        )
        dto_rating_1 = CreateFeedbackDTO(
            user_id=test_user["user_id"],
            rating=1,
            comments="Needs work",
        )
        create_feedback(dto_rating_3, db_session=db_session)
        create_feedback(dto_rating_2, db_session=db_session)
        create_feedback(dto_rating_1, db_session=db_session)

        # Act
        result = get_feedback_by_rating(rating=3, db_session=db_session)

        # Assert
        assert len(result) >= 1
        for feedback in result:
            assert feedback.rating == 3

    def test_get_feedback_by_rating_returns_empty_for_no_matches(
        self, db_session, test_user
    ):
        """Test that get_feedback_by_rating returns empty list when no matches"""
        # Arrange - Create feedback with only rating 2
        dto = CreateFeedbackDTO(
            user_id=test_user["user_id"],
            rating=2,
            comments="Good",
        )
        create_feedback(dto, db_session=db_session)

        # Act
        result = get_feedback_by_rating(rating=1, db_session=db_session)

        # Assert
        assert result == []
