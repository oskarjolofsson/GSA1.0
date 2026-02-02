from ..models.MandatoryConsent import MandatoryConsent
from ..session import SessionLocal
from sqlalchemy import select


def get_mandatory_consent_by_id(mandatory_consent_id) -> MandatoryConsent:
    with SessionLocal() as session:
        return session.get(MandatoryConsent, mandatory_consent_id)
    
    
def create_mandatory_consent(mandatory_consent: MandatoryConsent) -> MandatoryConsent:
    with SessionLocal() as session:
        try:
            session.add(mandatory_consent)
            session.commit()
            session.refresh(mandatory_consent)
            return mandatory_consent
        except Exception:
            session.rollback()
            raise