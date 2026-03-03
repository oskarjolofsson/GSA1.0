from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.dependencies.require_admin import require_admin
from core.services.admin_stats_service import get_admin_stats
from app.api.v1.schemas.admin import AdminStatsResponse

router = APIRouter()


@router.get("/stats", response_model=AdminStatsResponse)
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
