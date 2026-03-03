from fastapi import Depends
from sqlalchemy.orm import Session
from .db import get_db
from .auth import get_current_user
from core.services.user_service import is_admin
from core.services.exceptions import ForbiddenException

def require_admin(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user["user_id"]
    if not is_admin(user_id, db):
        raise ForbiddenException("Admin privileges required to access this resource")

    return current_user