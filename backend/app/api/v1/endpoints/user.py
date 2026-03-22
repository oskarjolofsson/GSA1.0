from fastapi import APIRouter, Depends
from app.dependencies.require_admin import require_admin
from core.services.user_service import get_all_users as service_get_all_users
from app.dependencies.db import get_db
from sqlalchemy.orm import Session
from app.api.v1.schemas.user import GetUser

router = APIRouter()


# ADMIN ONLY
@router.get("/all")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    print("Getting all users - ADMIN ONLY")
    users = service_get_all_users(db)
    return [GetUser.from_domain(user) for user in users]
    

