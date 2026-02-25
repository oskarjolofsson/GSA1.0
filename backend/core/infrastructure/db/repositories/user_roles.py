from ..models.UserRole import UserRole
from ..models.Role import Role
from sqlalchemy.orm import Session
from uuid import UUID


# ------------ GET ------------


def get_user_role(user_id: UUID, role_id: int, session: Session) -> UserRole | None:
    return session.get(UserRole, (user_id, role_id))


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


# ------------ CREATE ------------


def assign_role_to_user(user_role: UserRole, session: Session) -> UserRole:
    session.add(user_role)
    session.flush()
    return user_role


# ------------ DELETE ------------


def remove_role_from_user(user_id: UUID, role_id: int, session: Session) -> None:
    user_role = get_user_role(user_id, role_id, session)
    if user_role:
        session.delete(user_role)
        session.flush()


def remove_all_roles_from_user(user_id: UUID, session: Session) -> None:
    session.query(UserRole).filter(UserRole.user_id == user_id).delete()
    session.flush()
