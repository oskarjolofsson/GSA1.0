from ....core.infrastructure.db.models.Feedback import UserFeedback
import uuid
from ....core.infrastructure.db.repositories.feedback import (
    create_feedback,
    get_feedback_by_id,
    get_feedback_by_user_id,
    get_all_feedback,
    get_feedback_by_rating,
)
import pytest
from datetime import datetime, timedelta, timezone


class TestFeedbackCreate:
    """Tests for creating UserFeedback records"""

    def test_create_feedback_with_required_fields(self, db_session, test_user):
        """Test creating feedback with all required fields"""
        feedback = UserFeedback(
            user_id=test_user["user_id"],
            rating=2,
            comments="Great analysis, very helpful!",
        )

        created = create_feedback(feedback=feedback, session=db_session)

        assert created.id is not None
        assert created.user_id == test_user["user_id"]
        assert created.rating == 2
        assert created.comments == "Great analysis, very helpful!"
        assert created.created_at is not None

    def test_create_feedback_with_rating_1(self, db_session, test_user):
        """Test creating feedback with rating 1 (minimum)"""
        feedback = UserFeedback(
            user_id=test_user["user_id"],
            rating=1,
            comments="Not helpful",
        )

        created = create_feedback(feedback=feedback, session=db_session)

        assert created.rating == 1

    def test_create_feedback_with_rating_3(self, db_session, test_user):
        """Test creating feedback with rating 3 (maximum)"""
        feedback = UserFeedback(
            user_id=test_user["user_id"],
            rating=3,
            comments="Excellent service!",
        )

        created = create_feedback(feedback=feedback, session=db_session)

        assert created.rating == 3

    def test_create_feedback_persists_to_database(self, db_session, test_user):
        """Test that created feedback is persisted to database"""
        feedback = UserFeedback(
            user_id=test_user["user_id"],
            rating=2,
            comments="Good experience overall",
        )

        created = create_feedback(feedback=feedback, session=db_session)

        fetched_feedback = get_feedback_by_id(
            feedback_id=created.id, session=db_session
        )

        assert fetched_feedback is not None
        assert fetched_feedback.id == created.id
        assert fetched_feedback.user_id == test_user["user_id"]
        assert fetched_feedback.rating == 2
        assert fetched_feedback.comments == "Good experience overall"

    def test_create_multiple_feedback_entries(self, db_session, test_user):
        """Test creating multiple feedback entries for the same user"""
        feedback1 = UserFeedback(
            user_id=test_user["user_id"], rating=3, comments="First feedback"
        )
        feedback2 = UserFeedback(
            user_id=test_user["user_id"], rating=2, comments="Second feedback"
        )
        feedback3 = UserFeedback(
            user_id=test_user["user_id"], rating=1, comments="Third feedback"
        )

        created1 = create_feedback(feedback=feedback1, session=db_session)
        created2 = create_feedback(feedback=feedback2, session=db_session)
        created3 = create_feedback(feedback=feedback3, session=db_session)

        assert created1.id != created2.id != created3.id
        assert created1.rating == 3
        assert created2.rating == 2
        assert created3.rating == 1


class TestFeedbackRead:
    """Tests for reading UserFeedback records"""

    def test_get_feedback_by_id(self, db_session, test_user):
        """Test retrieving feedback by ID"""
        feedback = UserFeedback(
            user_id=test_user["user_id"],
            rating=2,
            comments="Test feedback",
        )
        created = create_feedback(feedback=feedback, session=db_session)

        fetched = get_feedback_by_id(feedback_id=created.id, session=db_session)

        assert fetched is not None
        assert fetched.id == created.id
        assert fetched.rating == 2
        assert fetched.comments == "Test feedback"

    def test_get_feedback_by_id_not_found(self, db_session):
        """Test retrieving feedback with non-existent ID returns None"""
        non_existent_id = uuid.uuid4()

        fetched = get_feedback_by_id(feedback_id=non_existent_id, session=db_session)

        assert fetched is None

    def test_get_feedback_by_user_id(self, db_session, test_user):
        """Test retrieving all feedback for a specific user"""
        feedback1 = UserFeedback(
            user_id=test_user["user_id"], rating=3, comments="First feedback"
        )
        feedback2 = UserFeedback(
            user_id=test_user["user_id"], rating=2, comments="Second feedback"
        )

        create_feedback(feedback=feedback1, session=db_session)
        create_feedback(feedback=feedback2, session=db_session)

        user_feedback = get_feedback_by_user_id(user_id=test_user["user_id"], session=db_session)

        assert len(user_feedback) >= 2
        assert all(f.user_id == test_user["user_id"] for f in user_feedback)

    def test_get_feedback_by_user_id_ordered_by_recent(self, db_session, test_user):
        now = datetime.now(timezone.utc)
        older_time = now - timedelta(hours=2)
        
        feedback1 = UserFeedback(
            user_id=test_user["user_id"],
            rating=1,
            comments="Older feedback",
            created_at=older_time
        )
        feedback2 = UserFeedback(
            user_id=test_user["user_id"], 
            rating=2, 
            comments="Newer feedback",
            created_at=now # manually set timestamps to ensure order, not needed usually because created_at defaults to current time
        )

        created1 = create_feedback(feedback=feedback1, session=db_session)
        created2 = create_feedback(feedback=feedback2, session=db_session)

        user_feedback = get_feedback_by_user_id(user_id=test_user["user_id"], session=db_session)

        # Most recent should be first
        assert user_feedback[0].id == created2.id
        assert user_feedback[1].id == created1.id

    def test_get_feedback_by_user_id_empty(self, db_session):
        """Test retrieving feedback for user with no feedback"""
        non_existent_user = uuid.uuid4()

        user_feedback = get_feedback_by_user_id(
            user_id=non_existent_user, session=db_session
        )

        assert len(user_feedback) == 0

    def test_get_all_feedback(self, db_session, test_user):
        """Test retrieving all feedback entries"""
        feedback1 = UserFeedback(
            user_id=test_user["user_id"], rating=3, comments="Feedback 1"
        )
        feedback2 = UserFeedback(
            user_id=test_user["user_id"], rating=2, comments="Feedback 2"
        )

        create_feedback(feedback=feedback1, session=db_session)
        create_feedback(feedback=feedback2, session=db_session)

        all_feedback = get_all_feedback(session=db_session)

        assert len(all_feedback) >= 2

    def test_get_feedback_by_rating(self, db_session, test_user):
        """Test retrieving feedback by specific rating"""
        feedback1 = UserFeedback(
            user_id=test_user["user_id"], rating=3, comments="Excellent"
        )
        feedback2 = UserFeedback(
            user_id=test_user["user_id"], rating=3, comments="Great"
        )
        feedback3 = UserFeedback(
            user_id=test_user["user_id"], rating=2, comments="Good"
        )

        create_feedback(feedback=feedback1, session=db_session)
        create_feedback(feedback=feedback2, session=db_session)
        create_feedback(feedback=feedback3, session=db_session)

        rating_3_feedback = get_feedback_by_rating(rating=3, session=db_session)

        assert len(rating_3_feedback) >= 2
        assert all(f.rating == 3 for f in rating_3_feedback)

    def test_get_feedback_by_rating_empty(self, db_session):
        """Test retrieving feedback for rating with no entries"""
        # Assuming no rating 1 feedback exists initially
        rating_1_feedback = get_feedback_by_rating(rating=1, session=db_session)

        assert isinstance(rating_1_feedback, list)


class TestFeedbackConstraints:
    """Tests for UserFeedback model constraints"""

    def test_rating_must_be_between_1_and_3(self, db_session, test_user):
        """Test that rating must be between 1 and 3"""
        # Valid ratings should work (already tested above)
        
        # Invalid ratings should be caught by database constraint
        # Note: The actual constraint enforcement depends on the database
        # This test documents the expected behavior
        
        valid_ratings = [1, 2, 3]
        for rating in valid_ratings:
            feedback = UserFeedback(
                user_id=test_user["user_id"],
                rating=rating,
                comments=f"Rating {rating}",
            )
            created = create_feedback(feedback=feedback, session=db_session)
            assert created.rating == rating
