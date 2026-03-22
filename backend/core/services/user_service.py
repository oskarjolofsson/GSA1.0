from .dtos.user_service_dto import (
    GetUserDTO,    
)
from .exceptions import NotFoundException
from core.infrastructure.db.repositories.profiles import get_all_profiles, get_profile_by_id
from core.infrastructure.db.repositories.user_roles import user_has_role, get_roles_for_users
from core.infrastructure.db.repositories.analysis import get_analysis_counts_by_user_ids
from core.infrastructure.db.models.Profile import Profile
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timezone, timedelta


def get_all_users(session: Session) -> list[GetUserDTO]:
    profiles: list[Profile] = get_all_profiles(session)
    
    if not profiles:
        return []
    
    # Collect all user IDs
    user_ids = [UUID(str(profile.id)) for profile in profiles]
    
    # Batch fetch roles for all users
    user_roles = get_roles_for_users(user_ids, session)
    
    # Batch fetch analysis counts for all users
    analysis_counts = get_analysis_counts_by_user_ids(user_ids, session)
    
    return [
        from_profile_to_dto(
            profile,
            role=user_roles.get(UUID(str(profile.id))),
            analyses_count=analysis_counts.get(UUID(str(profile.id)), 0)
        )
        for profile in profiles
    ]   


def is_admin(user_id: str, session: Session) -> bool:
    user: Profile = get_profile_by_id(user_id, session)
    if not user:
        raise NotFoundException(f"User with id {user_id} not found", user_id)
    
    return user_has_role(user_id, "admin", session)


    
    
# -------- Helper functions --------

def from_profile_to_dto(
    profile: Profile,
    role: str | None = None,
    analyses_count: int = 0
) -> GetUserDTO:
    return GetUserDTO(
        id=profile.id,
        name=profile.name,
        email=profile.email,
        role=role,
        analyses_count=analyses_count,
        created_at=profile.created_at.isoformat(),
        updated_at=profile.updated_at.isoformat() if profile.updated_at else None,
        active = profile.last_signed_in_at > datetime.now(timezone.utc) - timedelta(days=30) if profile.last_signed_in_at else None,
    )
