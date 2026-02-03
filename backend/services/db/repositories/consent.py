from ..models.UserConsent import UserConsent
from ..session import SessionLocal
from sqlalchemy import select


def get_consent_by_id(consent_id) -> UserConsent:
    with SessionLocal() as session:
        return session.get(UserConsent, consent_id)
    
    
def create_consent(consent: UserConsent) -> UserConsent:
    with SessionLocal() as session:
        try:
            session.add(consent)
            session.commit()
            session.refresh(consent)
            return consent
        except Exception:
            session.rollback()
            raise