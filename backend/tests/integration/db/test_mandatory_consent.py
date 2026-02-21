from ....core.infrastructure.db.models.MandatoryConsent import MandatoryConsent
import uuid
from ....core.infrastructure.db.repositories.mandatory_consent import (
    create_mandatory_consent,
    get_mandatory_consent_by_id,
)
import pytest


class TestMandatoryConsentCreate:
    """Tests for creating MandatoryConsent records"""

    def test_create_mandatory_consent_with_required_fields(self, db_session):
        """Test creating a mandatory consent with required fields"""
        # Create mandatory consent
        consent = MandatoryConsent(
            name="terms_of_service",
        )

        created = create_mandatory_consent(mandatory_consent=consent, session=db_session)

        assert created.id is not None
        assert created.name == "terms_of_service"

    def test_create_mandatory_consent_persists_to_database(self, db_session):
        """Test that created mandatory consent is persisted to database"""
        # Create mandatory consent
        consent = MandatoryConsent(
            name="privacy_policy",
        )

        created = create_mandatory_consent(mandatory_consent=consent, session=db_session)

        fetched_consent = get_mandatory_consent_by_id(created.id, session=db_session)

        assert fetched_consent is not None
        assert fetched_consent.id == created.id
        assert fetched_consent.name == "privacy_policy"

    def test_create_multiple_mandatory_consents(self, db_session):
        """Test creating multiple mandatory consents"""
        consent1 = MandatoryConsent(name="terms_of_service")
        consent2 = MandatoryConsent(name="privacy_policy")
        consent3 = MandatoryConsent(name="cookie_policy")

        created1 = create_mandatory_consent(mandatory_consent=consent1, session=db_session)
        created2 = create_mandatory_consent(mandatory_consent=consent2, session=db_session)
        created3 = create_mandatory_consent(mandatory_consent=consent3, session=db_session)

        assert created1.id != created2.id != created3.id
        assert created1.name == "terms_of_service"
        assert created2.name == "privacy_policy"
        assert created3.name == "cookie_policy"


class TestMandatoryConsentRead:
    """Tests for reading MandatoryConsent records"""

    def test_get_mandatory_consent_by_id(self, db_session):
        """Test retrieving a mandatory consent by ID"""
        # Create mandatory consent
        consent = MandatoryConsent(
            name="terms_of_service",
        )
        created = create_mandatory_consent(mandatory_consent=consent, session=db_session)

        fetched = get_mandatory_consent_by_id(created.id, session=db_session)

        assert fetched is not None
        assert fetched.id == created.id
        assert fetched.name == "terms_of_service"

    def test_get_mandatory_consent_by_id_not_found(self, db_session):
        """Test retrieving a non-existent mandatory consent returns None"""
        non_existent_id = uuid.uuid4()

        result = get_mandatory_consent_by_id(non_existent_id, session=db_session)

        assert result is None


class TestMandatoryConsentConstraints:
    """Tests for MandatoryConsent model constraints"""

    def test_mandatory_consent_id_is_uuid(self, db_session):
        """Test that id is a valid UUID"""
        # Create mandatory consent
        consent = MandatoryConsent(
            name="terms_of_service",
        )
        created = create_mandatory_consent(mandatory_consent=consent, session=db_session)

        assert isinstance(created.id, uuid.UUID)

    def test_mandatory_consent_requires_name(self, db_session):
        """Test that name is required"""
        consent = MandatoryConsent()

        with pytest.raises(Exception):
            create_mandatory_consent(mandatory_consent=consent, session=db_session)

    def test_mandatory_consent_name_must_be_unique(self, db_session):
        """Test that name must be unique"""
        consent1 = MandatoryConsent(name="terms_of_service")
        create_mandatory_consent(mandatory_consent=consent1, session=db_session)

        # Try to create another with the same name
        consent2 = MandatoryConsent(name="terms_of_service")

        with pytest.raises(Exception):
            create_mandatory_consent(mandatory_consent=consent2, session=db_session)
            db_session.commit()
