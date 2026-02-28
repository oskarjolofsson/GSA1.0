from .dtos.user_service_dto import (
    GetUserDTO,    
)
from .exceptions import NotFoundException
from core.infrastructure.db.repositories.profiles import get_all_profiles, get_profile_by_id
from core.infrastructure.db.repositories.user_roles import user_has_role
from core.infrastructure.db.models.Profile import Profile
from sqlalchemy.orm import Session


def get_user_by_id(user_id: str, session: Session) -> GetUserDTO:
    profile: Profile = get_profile_by_id(user_id, session)
    if not profile:
        raise NotFoundException(f"User with id {user_id} not found")
    
    return from_profile_to_dto(profile)


def get_all_users(session: Session) -> list[GetUserDTO]:
    profiles: list[Profile] = get_all_profiles(session)
    return [from_profile_to_dto(profile) for profile in profiles]   


def is_admin(user_id: str, session: Session) -> bool:
    user: Profile = get_profile_by_id(user_id, session)
    if not user:
        raise NotFoundException(f"User with id {user_id} not found", user_id)
    
    return user_has_role(user_id, "admin", session)


    
    
# -------- Helper functions --------

def from_profile_to_dto(profile: Profile) -> GetUserDTO:
    return GetUserDTO(
        id=profile.id,
        name=profile.name,
        email=profile.email,
        created_at=profile.created_at.isoformat(),
        updated_at=profile.updated_at.isoformat() if profile.updated_at else None,
    )
