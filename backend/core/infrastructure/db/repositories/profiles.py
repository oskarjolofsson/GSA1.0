from ..models.Profile import Profile
from sqlalchemy.orm import Session


def get_profile_by_id(profile_id, session: Session) -> Profile:
    return session.get(Profile, profile_id)
    
    
def create_profile(profile: Profile, session: Session) -> Profile:
    session.add(profile)
    session.flush()
    return profile