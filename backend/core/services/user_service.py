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
    delete_profile_by_id
)
from core.infrastructure.db.repositories import user_roles as user_roles_repo
from core.infrastructure.db.repositories.analysis import get_analysis_counts_by_user_ids
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timezone, timedelta
from supabase import create_client, Client
from supabase_auth.errors import AuthApiError
from core.config import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLL_KEY

_ADMIN_CLIENT: Client | None = None


def get_all_users(session: Session, *, limit: int, offset: int) -> PageDTO[GetUserDTO]:
    """One page of users (newest first) with the total, for the admin list."""
    profiles = get_profiles_page(
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
    profiles = search_profiles(session, query, limit=limit)
    return _enrich_profiles(profiles, session)


def is_admin(user_id: str, session: Session) -> bool:
    user = get_profile_by_id(user_id, session)
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
        user_roles_repo.add_role_to_user(UUID(user_id), admin_role.id, session)
        
    elif not set_to_admin and is_admin:
        user_roles_repo.remove_role_from_user(
            user_id=UUID(user_id), 
            role_id=admin_role.id, 
            session=session
        )
        
        
def delete_user_by_user_id(user_id: str, user_id_to_delete: str, db_session: Session):
    """Delete an account: the Supabase auth user first, its profile only after.

    The two live in different systems and no transaction spans them, so the order
    and the verification below are the whole safety story. `profiles.id` is
    REFERENCES auth.users(id) ON DELETE CASCADE, which means a successful auth
    delete has already removed the profile row -- the profile delete here is only
    a reconciliation for the case where it somehow survived, and is idempotent so
    the ordinary path (row already gone) is not an error.

    The profile is NEVER removed while the auth user still exists. An auth row
    without a profile is invisible to the admin panel (which lists profiles) yet
    still signs in, and handle_new_user only fires on INSERT into auth.users, so
    such an account can never be recovered or administered again.
    """
    if str(user_id) != str(user_id_to_delete) and not is_admin(user_id, db_session):
        raise exceptions.ForbiddenException(f"User not authorized to delete another user")

    user_to_delete = get_profile_by_id(str(user_id_to_delete), db_session)
    if not user_to_delete:
        raise exceptions.NotFoundException("Profile not found", str(user_id_to_delete))

    profile_id = str(user_to_delete.id)
    admin = _admin_client().auth.admin

    try:
        admin.delete_user(profile_id)
    except AuthApiError as error:
        # Already gone: a retry of a delete that half-succeeded must still be able
        # to clear the profile row below, so this is not a failure.
        if not _is_user_not_found(error):
            raise

    if _auth_user_exists(admin, profile_id):
        # Conflict rather than a bare 500: the admin gets the reason verbatim, and
        # the reason is the whole point -- the account is intact, not half-deleted.
        raise exceptions.ConflictException(
            f"Supabase still reports auth user {profile_id} after the delete call. "
            f"The profile was left in place so the account stays administrable."
        )

    # Detach the ORM object the cascade has most likely already deleted, then issue
    # an unconditional DELETE that tolerates zero matched rows.
    db_session.expunge(user_to_delete)
    delete_profile_by_id(profile_id, db_session)


def _admin_client() -> Client:
    """The service-role client, built once per process rather than per delete."""
    global _ADMIN_CLIENT
    if _ADMIN_CLIENT is None:
        _ADMIN_CLIENT = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLL_KEY)
    return _ADMIN_CLIENT


def _auth_user_exists(admin, user_id: str) -> bool:
    try:
        admin.get_user_by_id(user_id)
    except AuthApiError as error:
        if _is_user_not_found(error):
            return False
        raise
    return True


def _is_user_not_found(error: AuthApiError) -> bool:
    return getattr(error, "status", None) in (403, 404)


# -------- Helper functions --------


def _enrich_profiles(
    profiles: list, session: Session
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
    profile, role: str | None = None, analyses_count: int = 0
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
