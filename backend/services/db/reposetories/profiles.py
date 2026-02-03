from ..models.Profile import Profile
from ..session import SessionLocal
from sqlalchemy import select


def get_profile_by_id(profile_id) -> Profile:
    with SessionLocal() as session:
        return session.get(Profile, profile_id)
    
    
def create_profile(profile: Profile) -> Profile:
    with SessionLocal() as session:
        try:
            session.add(profile)
            session.commit()
            session.refresh(profile)
            return profile
        except Exception:
            session.rollback()
            raise