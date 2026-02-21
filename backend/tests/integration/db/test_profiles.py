from ....core.infrastructure.db.models.Profile import Profile
import uuid
from ....core.infrastructure.db.repositories.profiles import (
    create_profile,
    get_profile_by_id,
)
import pytest


class TestProfileCreate:
    """Tests for creating Profile records"""

    def test_create_profile_with_required_fields(self, db_session):
        """Test creating a profile with required fields"""
        # Create profile
        profile = Profile(
            name="John Doe",
            email="john.doe@example.com",
        )

        created = create_profile(profile=profile, session=db_session)

        assert created.id is not None
        assert created.name == "John Doe"
        assert created.email == "john.doe@example.com"
        assert created.created_at is not None

    def test_create_profile_persists_to_database(self, db_session):
        """Test that created profile is persisted to database"""
        # Create profile
        profile = Profile(
            name="Jane Smith",
            email="jane.smith@example.com",
        )

        created = create_profile(profile=profile, session=db_session)

        fetched_profile = get_profile_by_id(created.id, session=db_session)

        assert fetched_profile is not None
        assert fetched_profile.id == created.id
        assert fetched_profile.name == "Jane Smith"
        assert fetched_profile.email == "jane.smith@example.com"

    def test_create_multiple_profiles(self, db_session):
        """Test creating multiple profiles"""
        profile1 = Profile(name="Alice", email="alice@example.com")
        profile2 = Profile(name="Bob", email="bob@example.com")
        profile3 = Profile(name="Charlie", email="charlie@example.com")

        created1 = create_profile(profile=profile1, session=db_session)
        created2 = create_profile(profile=profile2, session=db_session)
        created3 = create_profile(profile=profile3, session=db_session)

        assert created1.id != created2.id != created3.id
        assert created1.name == "Alice"
        assert created2.name == "Bob"
        assert created3.name == "Charlie"


class TestProfileRead:
    """Tests for reading Profile records"""

    def test_get_profile_by_id(self, db_session):
        """Test retrieving a profile by ID"""
        # Create profile
        profile = Profile(
            name="Test User",
            email="test@example.com",
        )
        created = create_profile(profile=profile, session=db_session)

        fetched = get_profile_by_id(created.id, session=db_session)

        assert fetched is not None
        assert fetched.id == created.id
        assert fetched.name == "Test User"
        assert fetched.email == "test@example.com"

    def test_get_profile_by_id_not_found(self, db_session):
        """Test retrieving a non-existent profile returns None"""
        non_existent_id = uuid.uuid4()

        result = get_profile_by_id(non_existent_id, session=db_session)

        assert result is None


class TestProfileConstraints:
    """Tests for Profile model constraints"""

    def test_profile_id_is_uuid(self, db_session):
        """Test that profile ID is a valid UUID"""
        # Create profile
        profile = Profile(
            name="UUID Test",
            email="uuid@example.com",
        )
        created = create_profile(profile=profile, session=db_session)

        assert isinstance(created.id, uuid.UUID)

    def test_profile_requires_name(self, db_session):
        """Test that name is required"""
        profile = Profile(
            email="noname@example.com",
        )

        with pytest.raises(Exception):
            create_profile(profile=profile, session=db_session)

    def test_profile_requires_email(self, db_session):
        """Test that email is required"""
        profile = Profile(
            name="No Email",
        )

        with pytest.raises(Exception):
            create_profile(profile=profile, session=db_session)

    def test_profile_email_must_be_unique(self, db_session):
        """Test that email must be unique"""
        profile1 = Profile(name="User One", email="unique@example.com")
        create_profile(profile=profile1, session=db_session)

        # Try to create another with the same email
        profile2 = Profile(name="User Two", email="unique@example.com")

        with pytest.raises(Exception):
            create_profile(profile=profile2, session=db_session)
            db_session.commit()

    def test_profile_created_at_is_auto_set(self, db_session):
        """Test that created_at is automatically set"""
        profile = Profile(
            name="Auto Time",
            email="autotime@example.com",
        )

        created = create_profile(profile=profile, session=db_session)

        assert created.created_at is not None
