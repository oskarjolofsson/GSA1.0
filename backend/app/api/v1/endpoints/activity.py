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
    from_date: date | None = Query(None, description="Inclusive first calendar day in `tz`."),
    to_date: date | None = Query(None, description="Inclusive last calendar day in `tz`."),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Per-day, per-area activity counts for the contribution graph.

    Sums completed practice sessions and successful analyses, grouped by calendar day in
    `tz` and by area, so a day with two areas returns two rows. `area` is null for
    unattributed activity — free practice, and anything predating per-area sessions.

    `from_date`/`to_date` are inclusive and optional; omitting both returns all history.
    A backwards range is a 422, not an empty list, which would read as "you did nothing".
    """
    user_id = UUID(current_user["user_id"])
    counts = service_get_activity_counts(
        user_id=user_id, tz=tz, session=db, from_date=from_date, to_date=to_date
    )
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
