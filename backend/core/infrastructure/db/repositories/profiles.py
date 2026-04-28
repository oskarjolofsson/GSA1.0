from ..models.Profile import Profile
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from datetime import datetime, timedelta, timezone


def get_profile_by_id(profile_id, session: Session) -> Profile:
    return session.get(Profile, profile_id)
    
    
def get_all_profiles(session: Session) -> list[Profile]:
    return session.query(Profile).all()

# ------------ COUNT ------------


def get_profile_count(session: Session) -> int:
    """Get total count of profiles."""
    stmt = select(func.count()).select_from(Profile)
    return session.scalar(stmt) or 0


def get_new_profiles_count(session: Session, days: int) -> int:
    """Get count of profiles created within the last X days."""
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    stmt = (
        select(func.count())
        .select_from(Profile)
        .where(Profile.created_at >= cutoff_date)
    )
    return session.scalar(stmt) or 0


# --------------------- Delete ------------------

def delete_profile(profile: Profile, session: Session):
    session.delete(profile)
    session.flush()