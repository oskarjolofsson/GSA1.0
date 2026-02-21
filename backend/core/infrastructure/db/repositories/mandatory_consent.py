from ..models.MandatoryConsent import MandatoryConsent
from sqlalchemy.orm import Session


def get_mandatory_consent_by_id(mandatory_consent_id, session: Session) -> MandatoryConsent:
    return session.get(MandatoryConsent, mandatory_consent_id)
    
    
def create_mandatory_consent(mandatory_consent: MandatoryConsent, session: Session) -> MandatoryConsent:
    session.add(mandatory_consent)
    session.flush()
    return mandatory_consent