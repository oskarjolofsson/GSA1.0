from ..models.Profile import Profile
from sqlalchemy.orm import Session


def get_profile_by_id(profile_id, session: Session) -> Profile:
    return session.get(Profile, profile_id)
    
    
def get_all_profiles(session: Session) -> list[Profile]:
    return session.query(Profile).all()