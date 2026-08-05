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
    """
    Per-day, per-area activity counts for the contribution graph.

    Sums completed practice sessions and completed successful analyses, grouped by
    calendar day in `tz` AND by area, so the graph can stack a bunker session against a
    range session. A day with two areas returns two rows; a client that only wants the
    old "did anything happen" answer sums them.

    `area` is null for unattributed activity: free practice with no issue behind it, and
    anything created before sessions carried an area.

    `from_date`/`to_date` bound the range, both inclusive and both optional. Omitting
    them returns the user's whole history, which is what this endpoint did before it
    could be bounded. `from_date` after `to_date` is a 422 rather than an empty list --
    an empty graph reads as "you did no practice", which the caller cannot tell from a
    range it got backwards.
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
