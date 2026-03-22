from ..models.UserRole import UserRole
from ..models.Role import Role
from sqlalchemy.orm import Session
from sqlalchemy import select
from uuid import UUID


# ------------ GET ------------


def get_user_role(user_id: UUID, role_id: int, session: Session) -> UserRole | None:
    return session.get(UserRole, (user_id, role_id))


def get_roles_for_users(user_ids: list[UUID], session: Session) -> dict[UUID, str]:
    """
    Get the primary role for multiple users in a single query.
    Returns a dict mapping user_id to role name.
    If a user has multiple roles, returns the first one found.
    """
    if not user_ids:
        return {}
    
    stmt = (
        select(UserRole.user_id, Role.name)
        .join(Role, UserRole.role_id == Role.id)
        .where(UserRole.user_id.in_(user_ids))
    )
    
    results = session.execute(stmt).all()
    
    # Build dict - first role found for each user
    user_roles: dict[UUID, str] = {}
    for user_id, role_name in results:
        if user_id not in user_roles:
            user_roles[user_id] = role_name
    
    return user_roles


def get_roles_by_user_id(user_id: UUID, session: Session) -> list[Role]:
    return (
        session.query(Role)
        .join(UserRole, Role.id == UserRole.role_id)
        .filter(UserRole.user_id == user_id)
        .all()
    )


def get_user_roles_by_user_id(user_id: UUID, session: Session) -> list[UserRole]:
    return session.query(UserRole).filter(UserRole.user_id == user_id).all()


def get_users_by_role_id(role_id: int, session: Session) -> list[UUID]:
    results = session.query(UserRole.user_id).filter(UserRole.role_id == role_id).all()
    return [r[0] for r in results]


def user_has_role(user_id: UUID, role_name: str, session: Session) -> bool:
    return (
        session.query(UserRole)
        .join(Role, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == user_id, Role.name == role_name)
        .first()
        is not None
    )
    
    
def get_role_by_name(role_name: str, session: Session) -> Role | None:
    role = session.query(Role).filter(Role.name == role_name).first()
    return role


# ------------ CREATE ------------

def assign_role_to_user(user_role: UserRole, session: Session) -> UserRole:
    existing: UserRole | None = get_user_role(user_role.user_id, user_role.role_id, session)
    
    if existing:
        return existing  # Role already assigned, return existing record
    
    session.add(user_role)
    session.flush()
    return user_role


# ------------ DELETE ------------


def remove_role_from_user(user_id: UUID, role_id: int, session: Session) -> None:
    user_role: UserRole | None = get_user_role(user_id, role_id, session)
    if user_role:
        session.delete(user_role)
        session.flush()


def remove_all_roles_from_user(user_id: UUID, session: Session) -> None:
    session.query(UserRole).filter(UserRole.user_id == user_id).delete()
    session.flush()
