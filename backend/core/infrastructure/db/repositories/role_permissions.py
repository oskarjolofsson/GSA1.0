from ..models.RolePermission import RolePermission
from ..models.Permission import Permission
from sqlalchemy.orm import Session


# ------------ GET ------------


def get_role_permission(role_id: int, permission_id: int, session: Session) -> RolePermission | None:
    return session.get(RolePermission, (role_id, permission_id))


def get_permissions_by_role_id(role_id: int, session: Session) -> list[Permission]:
    return (
        session.query(Permission)
        .join(RolePermission, Permission.id == RolePermission.permission_id)
        .filter(RolePermission.role_id == role_id)
        .all()
    )


def get_role_permissions_by_role_id(role_id: int, session: Session) -> list[RolePermission]:
    return session.query(RolePermission).filter(RolePermission.role_id == role_id).all()


def role_has_permission(role_id: int, permission_name: str, session: Session) -> bool:
    return (
        session.query(RolePermission)
        .join(Permission, RolePermission.permission_id == Permission.id)
        .filter(RolePermission.role_id == role_id, Permission.name == permission_name)
        .first()
        is not None
    )


# ------------ CREATE ------------


def assign_permission_to_role(role_permission: RolePermission, session: Session) -> RolePermission:
    session.add(role_permission)
    session.flush()
    return role_permission


def assign_permissions_to_role(role_id: int, permission_ids: list[int], session: Session) -> list[RolePermission]:
    role_permissions = [
        RolePermission(role_id=role_id, permission_id=pid) for pid in permission_ids
    ]
    session.add_all(role_permissions)
    session.flush()
    return role_permissions


# ------------ DELETE ------------


def remove_permission_from_role(role_id: int, permission_id: int, session: Session) -> None:
    role_permission = get_role_permission(role_id, permission_id, session)
    if role_permission:
        session.delete(role_permission)
        session.flush()


def remove_all_permissions_from_role(role_id: int, session: Session) -> None:
    session.query(RolePermission).filter(RolePermission.role_id == role_id).delete()
    session.flush()
