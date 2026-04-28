from fastapi import APIRouter, Depends
from app.dependencies.require_admin import require_admin
from app.dependencies.auth import get_current_user
from core.services import user_service
from app.dependencies.db import get_db
from sqlalchemy.orm import Session
from app.api.v1.schemas.user import GetUser
from uuid import UUID

router = APIRouter()


# ADMIN ONLY
@router.get("/all/")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    print("Getting all users - ADMIN ONLY")
    users = user_service.get_all_users(db)
    return [GetUser.from_domain(user) for user in users]
    

@router.delete("/{user_id}/", status_code=204)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    print("Trying to delete the given user with ID:", user_id)
    user_service.delete_user_by_user_id(user_id=current_user["user_id"] ,user_id_to_delete=user_id, db_session=db)