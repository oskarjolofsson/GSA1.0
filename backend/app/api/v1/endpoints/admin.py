from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.dependencies.require_admin import require_admin
from app.dependencies.auth import get_current_user
from core.services.admin_stats_service import get_admin_stats
from app.api.v1.schemas.admin import AdminStatsResponse, AdminVerifyResponse
from core.services.user_service import is_admin

router = APIRouter()


@router.get("/stats/", response_model=AdminStatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Get admin dashboard statistics.
    
    Returns counts for drills, issues, mappings, users, and various metrics
    needed for the admin dashboard overview.
    
    Requires admin privileges.
    """
    stats = get_admin_stats(db)
    return AdminStatsResponse.from_domain(stats)


@router.get("/verify/", response_model=AdminVerifyResponse)
def verify_admin(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Verify if the current user has admin privilages
    """
    user_id = current_user["user_id"]
    return AdminVerifyResponse(
        is_admin=is_admin(user_id=user_id, session=db)
    )
    
