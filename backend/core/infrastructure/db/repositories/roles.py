from ..models.Role import Role
from sqlalchemy.orm import Session


# ------------ GET ------------


def get_role_by_id(role_id: int, session: Session) -> Role | None:
    return session.get(Role, role_id)


def get_role_by_name(name: str, session: Session) -> Role | None:
    return session.query(Role).filter(Role.name == name).first()


def get_all_roles(session: Session) -> list[Role]:
    return session.query(Role).all()


def get_system_roles(session: Session) -> list[Role]:
    return session.query(Role).filter(Role.is_system == True).all()


def get_paid_roles(session: Session) -> list[Role]:
    return session.query(Role).filter(Role.is_paid == True).all()


# ------------ CREATE ------------


def create_role(role: Role, session: Session) -> Role:
    session.add(role)
    session.flush()
    return role


# ------------ UPDATE ------------


def update_role(role: Role, session: Session) -> Role:
    session.add(role)
    session.flush()
    return role


# ------------ DELETE ------------


def delete_role(role: Role, session: Session) -> None:
    session.delete(role)
    session.flush()
