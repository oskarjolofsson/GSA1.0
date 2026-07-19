from fastapi import APIRouter, Depends, Query
from app.dependencies.require_admin import require_admin
from app.dependencies.auth import get_current_user
from core.services import user_service
from app.dependencies.db import get_db
from sqlalchemy.orm import Session
from app.api.v1.schemas.user import GetUser, GetUserPageResponse, SetUserRoleRequest
from uuid import UUID

router = APIRouter()


# ADMIN ONLY
@router.get("/", response_model=GetUserPageResponse)
def list_users(
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Paginated list of users (newest first). Requires admin privileges."""
    page = user_service.get_all_users(db, limit=limit, offset=offset)
    return GetUserPageResponse.from_domain(page)


@router.get("/search/", response_model=list[GetUser])
def search_users(
    q: str = Query(default=""),
    limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Search users by name/email. Requires admin privileges."""
    users = user_service.search_users(db, q, limit=limit)
    return [GetUser.from_domain(user) for user in users]


@router.patch("/{user_id}/role/", response_model=GetUser)
def set_user_role(
    user_id: UUID,
    body: SetUserRoleRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Change a user's role (admin only). Cannot change your own role (403)."""
    dto = user_service.set_user_role(
        caller_id=current_user["user_id"],
        target_id=user_id,
        role=body.role,
        session=db,
    )
    return GetUser.from_domain(dto)


@router.delete("/{user_id}/", status_code=204)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_service.delete_user_by_user_id(user_id=current_user["user_id"], user_id_to_delete=user_id, db_session=db)