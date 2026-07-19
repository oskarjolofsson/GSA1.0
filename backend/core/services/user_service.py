from .dtos.user_service_dto import (
    GetUserDTO,
)
from .dtos.subscription import PageDTO
from core.services import exceptions
from core.infrastructure.db.repositories.profiles import (
    get_profiles_page,
    get_profile_count,
    get_profile_by_id,
    search_profiles,
    delete_profile
)
from core.infrastructure.db.repositories import user_roles as user_roles_repo
from core.infrastructure.db.repositories.analysis import get_analysis_counts_by_user_ids
from core.infrastructure.db import models
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timezone, timedelta
from supabase import create_client, Client
from core.config import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLL_KEY


def get_all_users(session: Session, *, limit: int, offset: int) -> PageDTO[GetUserDTO]:
    """One page of users (newest first) with the total, for the admin list."""
    profiles: list[models.Profile] = get_profiles_page(
        session, limit=limit, offset=offset
    )
    total = get_profile_count(session)
    items = _enrich_profiles(profiles, session)
    return PageDTO(items=items, total=total, limit=limit, offset=offset)


VALID_ROLES = {"user", "admin"}


def set_user_role(
    caller_id: str, target_id: str, role: str, session: Session
) -> GetUserDTO:
    """Set a user's role (admin only). Returns the updated, enriched user.

    An admin cannot change their OWN role: the admin gate is checked at sign-in,
    so self-demotion would lock the caller out of the dashboard. Guarded here as
    the authoritative check (the frontend also disables the control).
    """
    if str(caller_id) == str(target_id):
        raise exceptions.ForbiddenException("You can't change your own role")
    if role not in VALID_ROLES:
        raise exceptions.ValidationException(f"Unknown role: {role}")

    set_admin(str(target_id), role == "admin", session)

    profile = get_profile_by_id(str(target_id), session)
    if not profile:
        raise exceptions.NotFoundException("Profile not found", str(target_id))
    return _enrich_profiles([profile], session)[0]


def search_users(session: Session, query: str, *, limit: int) -> list[GetUserDTO]:
    """Admin search over users by name/email, returning the full user shape."""
    if not query.strip():
        return []
    profiles: list[models.Profile] = search_profiles(session, query, limit=limit)
    return _enrich_profiles(profiles, session)


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
        
        
def delete_user_by_user_id(user_id: str, user_id_to_delete: str, db_session: Session):
    if str(user_id) != str(user_id_to_delete) and not is_admin(user_id, db_session):
        raise exceptions.ForbiddenException(f"User not authorized to delete another user")
    
    user_to_delete: models.Profile = get_profile_by_id(str(user_id_to_delete), db_session)
    if not user_to_delete:
        raise exceptions.NotFoundException("Profile not found", str(user_id_to_delete))
    
    admin_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLL_KEY)
    admin_client.auth.admin.delete_user(str(user_to_delete.id))
    
    delete_profile(user_to_delete, db_session)


# -------- Helper functions --------


def _enrich_profiles(
    profiles: list[models.Profile], session: Session
) -> list[GetUserDTO]:
    """Map profiles to DTOs, batch-fetching roles + analysis counts.

    Roles and counts are fetched in ONE query each over the whole id set (no
    per-profile queries — avoids N+1). Shared by the list and search paths.
    """
    if not profiles:
        return []

    user_ids = [UUID(str(profile.id)) for profile in profiles]
    user_roles = user_roles_repo.get_roles_for_users(user_ids, session)
    analysis_counts = get_analysis_counts_by_user_ids(user_ids, session)

    return [
        from_profile_to_dto(
            profile,
            role=user_roles.get(UUID(str(profile.id))),
            analyses_count=analysis_counts.get(UUID(str(profile.id)), 0),
        )
        for profile in profiles
    ]


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
