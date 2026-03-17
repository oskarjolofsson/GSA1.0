from ....core.infrastructure.db.models.UserConsent import UserConsent
from ....core.infrastructure.db.models.MandatoryConsent import MandatoryConsent
import uuid
from ....core.infrastructure.db.repositories.consent import (
    create_consent,
    get_consent_by_id,
)
from ....core.infrastructure.db.repositories.mandatory_consent import create_mandatory_consent
import pytest


@pytest.fixture
def test_mandatory_consent(db_session):
    """Create a mandatory consent for testing"""
    consent = MandatoryConsent(
        name="terms_of_service",
    )
    return create_mandatory_consent(mandatory_consent=consent, session=db_session)


class TestUserConsentCreate:
    """Tests for creating UserConsent records"""

    def test_create_consent_with_required_fields(self, db_session, test_user, test_mandatory_consent):
        """Test creating a user consent with required fields"""
        consent = UserConsent(
            user_id=test_user,
            mandatory_consent_id=test_mandatory_consent.id,
            granted=True,
        )

        created = create_consent(consent=consent, session=db_session)

        assert created.user_id == test_user
        assert created.mandatory_consent_id == test_mandatory_consent.id
        assert created.granted is True
        assert created.granted_at is not None
        assert created.ip_address is None
        assert created.user_agent is None

    def test_create_consent_with_all_fields(self, db_session, test_user, test_mandatory_consent):
        """Test creating a user consent with all optional fields"""
        consent = UserConsent(
            user_id=test_user,
            mandatory_consent_id=test_mandatory_consent.id,
            granted=True,
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0",
        )

        created = create_consent(consent=consent, session=db_session)

        assert created.user_id == test_user
        assert created.mandatory_consent_id == test_mandatory_consent.id
        assert created.granted is True
        assert created.granted_at is not None
        assert str(created.ip_address) == "192.168.1.1"
        assert created.user_agent == "Mozilla/5.0"

    def test_create_consent_persists_to_database(self, db_session, test_user, test_mandatory_consent):
        """Test that created consent is persisted to database"""
        consent = UserConsent(
            user_id=test_user,
            mandatory_consent_id=test_mandatory_consent.id,
            granted=True,
        )

        create_consent(consent=consent, session=db_session)

        fetched_consent = get_consent_by_id(test_user, test_mandatory_consent.id, session=db_session)

        assert fetched_consent is not None
        assert fetched_consent.user_id == test_user
        assert fetched_consent.mandatory_consent_id == test_mandatory_consent.id
        assert fetched_consent.granted is True


class TestUserConsentRead:
    """Tests for reading UserConsent records"""

    def test_get_consent_by_composite_id(self, db_session, test_user, test_mandatory_consent):
        """Test retrieving a user consent by composite ID"""
        consent = UserConsent(
            user_id=test_user,
            mandatory_consent_id=test_mandatory_consent.id,
            granted=True,
        )
        create_consent(consent=consent, session=db_session)

        fetched = get_consent_by_id(test_user, test_mandatory_consent.id, session=db_session)

        assert fetched is not None
        assert fetched.user_id == test_user
        assert fetched.mandatory_consent_id == test_mandatory_consent.id
        assert fetched.granted is True

    def test_get_consent_by_id_not_found(self, db_session):
        """Test retrieving a non-existent user consent returns None"""
        non_existent_user_id = uuid.uuid4()
        non_existent_consent_id = uuid.uuid4()

        result = get_consent_by_id(non_existent_user_id, non_existent_consent_id, session=db_session)

        assert result is None


class TestUserConsentConstraints:
    """Tests for UserConsent model constraints"""

    def test_consent_composite_primary_key(self, db_session, test_user, test_mandatory_consent):
        """Test that composite primary key enforces uniqueness"""
        consent1 = UserConsent(
            user_id=test_user,
            mandatory_consent_id=test_mandatory_consent.id,
            granted=True,
        )
        create_consent(consent=consent1, session=db_session)

        # Try to create duplicate - should fail
        consent2 = UserConsent(
            user_id=test_user,
            mandatory_consent_id=test_mandatory_consent.id,
            granted=False,
        )

        with pytest.raises(Exception):
            create_consent(consent=consent2, session=db_session)
            db_session.flush()

    def test_consent_requires_user_id(self, db_session, test_mandatory_consent):
        """Test that user_id is required"""
        consent = UserConsent(
            mandatory_consent_id=test_mandatory_consent.id,
            granted=True,
        )

        with pytest.raises(Exception):
            create_consent(consent=consent, session=db_session)

    def test_consent_requires_mandatory_consent_id(self, db_session, test_user):
        """Test that mandatory_consent_id is required"""
        consent = UserConsent(
            user_id=test_user,
            granted=True,
        )

        with pytest.raises(Exception):
            create_consent(consent=consent, session=db_session)

    def test_consent_requires_granted(self, db_session, test_user, test_mandatory_consent):
        """Test that granted is required"""
        consent = UserConsent(
            user_id=test_user,
            mandatory_consent_id=test_mandatory_consent.id,
        )

        with pytest.raises(Exception):
            create_consent(consent=consent, session=db_session)
