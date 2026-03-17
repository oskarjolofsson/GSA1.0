from core.infrastructure.db.models.Profile import Profile
import uuid
from core.infrastructure.db.repositories.profiles import (
    get_profile_by_id,
)
import pytest
from datetime import datetime


class TestProfileRead:
    """Tests for reading Profile records"""

    def test_get_profile_by_id_not_found(self, db_session):
        """Test retrieving a non-existent profile returns None"""
        non_existent_id = uuid.uuid4()

        result = get_profile_by_id(non_existent_id, session=db_session)

        assert result is None


class TestProfileConstraints:
    """Tests for Profile model constraints"""

    def test_profile_is_created_automatically(self, db_session, test_user):
        """Test that profile ID is a valid UUID"""
        created = get_profile_by_id(test_user["user_id"], session=db_session)

        assert created.email == test_user["email"]
        assert created.id == test_user["user_id"]
        assert created.name == "Test User"
        assert isinstance(created.id, uuid.UUID)

    def test_profile_created_at_is_auto_set(self, db_session, test_user):
        """Test that created_at is automatically set"""

        created = get_profile_by_id(test_user["user_id"], session=db_session)

        assert created.created_at is not None
        assert isinstance(created.created_at, datetime)
        
