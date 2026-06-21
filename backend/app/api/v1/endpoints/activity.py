from fastapi import APIRouter, Depends, Query
from uuid import UUID
from datetime import date
from sqlalchemy.orm import Session

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user

from app.api.v1.schemas.activity import ActivityCount, ActivityDayDetail
from core.services.activity_service import (
    get_activity_counts as service_get_activity_counts,
    get_day_detail as service_get_day_detail,
)

router = APIRouter()


@router.get("/", response_model=list[ActivityCount])
def get_activity(
    tz: str = Query("UTC", description="IANA timezone name for day grouping, e.g. Europe/Stockholm"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Per-day activity counts for the contribution graph.

    Sums completed practice sessions and completed successful analyses, grouped
    by calendar day in `tz`. A count >= 1 lights that day's square.
    """
    user_id = UUID(current_user["user_id"])
    counts = service_get_activity_counts(user_id=user_id, tz=tz, session=db)
    return [ActivityCount.from_domain(c) for c in counts]


@router.get("/{activity_date}/", response_model=ActivityDayDetail)
def get_activity_day_detail(
    activity_date: date,
    tz: str = Query("UTC", description="IANA timezone name for day boundaries, e.g. Europe/Stockholm"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    The specific activities that occurred on `activity_date` (in `tz`): completed
    practice sessions with their drill runs, and completed successful analyses
    with their thumbnails. Empty arrays when nothing of a type occurred.
    """
    user_id = UUID(current_user["user_id"])
    detail = service_get_day_detail(user_id=user_id, target_date=activity_date, tz=tz, session=db)
    return ActivityDayDetail.from_domain(detail)
