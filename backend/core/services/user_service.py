from .dtos.user_service_dto import (
    GetUserDTO,
)
from core.services import exceptions
from core.infrastructure.db.repositories.profiles import (
    get_all_profiles,
    get_profile_by_id,
)
from core.infrastructure.db.repositories import user_roles as user_roles_repo
from core.infrastructure.db.repositories.analysis import get_analysis_counts_by_user_ids
from core.infrastructure.db import models
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timezone, timedelta


def get_all_users(session: Session) -> list[GetUserDTO]:
    profiles: list[models.Profile] = get_all_profiles(session)

    if not profiles:
        return []

    # Collect all user IDs
    user_ids = [UUID(str(profile.id)) for profile in profiles]

    # Batch fetch roles for all users
    user_roles = user_roles_repo.get_roles_for_users(user_ids, session)

    # Batch fetch analysis counts for all users
    analysis_counts = get_analysis_counts_by_user_ids(user_ids, session)

    return [
        from_profile_to_dto(
            profile,
            role=user_roles.get(UUID(str(profile.id))),
            analyses_count=analysis_counts.get(UUID(str(profile.id)), 0),
        )
        for profile in profiles
    ]


def is_admin(user_id: str, session: Session) -> bool:
    user: models.Profile = get_profile_by_id(user_id, session)
    if not user:
        raise exceptions.NotFoundException(f"User with id {user_id} not found", user_id)

    return user_roles_repo.user_has_role(user_id, "admin", session)


def set_admin(user_id: str, set_to_admin: bool, session: Session) -> None:
    user = get_profile_by_id(user_id, session)
    if not user:
        raise exceptions.NotFoundException(f"User {user_id} not found", user_id)
        
    admin_role = user_roles_repo.get_role_by_name("admin", session)
    if not admin_role:
        raise exceptions.NotFoundException("Admin role missing in system", "admin")

    is_admin = user_roles_repo.user_has_role(user_id, "admin", session)

    if set_to_admin and not is_admin:
        new_role = models.UserRole(user_id=UUID(user_id), role_id=admin_role.id)
        user_roles_repo.assign_role_to_user(new_role, session)
        
    elif not set_to_admin and is_admin:
        user_roles_repo.remove_role_from_user(
            user_id=UUID(user_id), 
            role_id=admin_role.id, 
            session=session
        )


# -------- Helper functions --------


def from_profile_to_dto(
    profile: models.Profile, role: str | None = None, analyses_count: int = 0
) -> GetUserDTO:
    return GetUserDTO(
        id=profile.id,
        name=profile.name,
        email=profile.email,
        role=role,
        analyses_count=analyses_count,
        created_at=profile.created_at.isoformat(),
        updated_at=profile.updated_at.isoformat() if profile.updated_at else None,
        active=(
            profile.last_signed_in_at > datetime.now(timezone.utc) - timedelta(days=30)
            if profile.last_signed_in_at
            else None
        ),
    )
