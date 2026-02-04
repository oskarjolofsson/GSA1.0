from ..models.UserConsent import UserConsent
from sqlalchemy.orm import Session


def get_consent_by_id(user_id, mandatory_consent_id, session: Session) -> UserConsent:
    return session.get(UserConsent, (user_id, mandatory_consent_id))
    
    
def create_consent(consent: UserConsent, session: Session) -> UserConsent:
    session.add(consent)
    session.flush()
    return consent