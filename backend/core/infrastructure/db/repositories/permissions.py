from ..models.Permission import Permission
from sqlalchemy.orm import Session


# ------------ GET ------------


def get_permission_by_id(permission_id: int, session: Session) -> Permission | None:
    return session.get(Permission, permission_id)


def get_permission_by_name(name: str, session: Session) -> Permission | None:
    return session.query(Permission).filter(Permission.name == name).first()


def get_all_permissions(session: Session) -> list[Permission]:
    return session.query(Permission).all()


def get_permissions_by_ids(permission_ids: list[int], session: Session) -> list[Permission]:
    return session.query(Permission).filter(Permission.id.in_(permission_ids)).all()


# ------------ CREATE ------------


def create_permission(permission: Permission, session: Session) -> Permission:
    session.add(permission)
    session.flush()
    return permission


# ------------ UPDATE ------------


def update_permission(permission: Permission, session: Session) -> Permission:
    session.add(permission)
    session.flush()
    return permission


# ------------ DELETE ------------


def delete_permission(permission: Permission, session: Session) -> None:
    session.delete(permission)
    session.flush()
