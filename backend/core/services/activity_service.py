"""
Activity service — read-time projection of practice sessions + analyses into the
contribution-graph shape. No dedicated activity table: both sources are already
reliably timestamped per user, so the graph is derived on read.

    counts:   practice_sessions (completed)  ┐
                                              ├─ group by local calendar day ─> [{occurred_on, count}]
              analysis (completed & success)  ┘

    detail:   sessions + their drill runs, analyses + their thumbnails, for one day.
"""

from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from core.services import exceptions
from core.infrastructure.db.repositories import practice_sessions as practice_repo
from core.infrastructure.db.repositories import analysis as analysis_repo
from core.infrastructure.db.repositories import drills as drill_repo
from core.infrastructure.db import models
from core.services.video import get_video_thumbnail_urls_from_analyses
from core.services.dtos.activity_service_dto import (
    ActivityCountDTO,
    ActivityDayDetailDTO,
    ActivitySessionDTO,
    ActivityAnalysisDTO,
    ActivityDrillRunDTO,
)


def _resolve_tz(tz: str) -> ZoneInfo:
    """Validate an IANA timezone name; raise ValidationException (422) if invalid."""
    try:
        return ZoneInfo(tz)
    except (ZoneInfoNotFoundError, ValueError, KeyError):
        raise exceptions.ValidationException(f"Invalid timezone: {tz!r}")


def get_activity_counts(user_id: UUID, tz: str, session: Session) -> list[ActivityCountDTO]:
    """
    Return per-day activity counts for the contribution graph, summing completed
    practice sessions and completed successful analyses, grouped by calendar day
    in the given timezone. Sorted ascending by date.
    """
    _resolve_tz(tz)  # validate; the GROUP BY runs in Postgres using the same name

    counts: dict[date, int] = {}
    for day, count in practice_repo.get_completed_session_counts_by_day(user_id, tz, session):
        counts[day] = counts.get(day, 0) + count
    for day, count in analysis_repo.get_activity_counts_by_day(user_id, tz, session):
        counts[day] = counts.get(day, 0) + count

    return [ActivityCountDTO(occurred_on=day, count=counts[day]) for day in sorted(counts)]


def get_day_detail(user_id: UUID, target_date: date, tz: str, session: Session) -> ActivityDayDetailDTO:
    """
    Return the completed sessions (with drill runs) and completed successful
    analyses (with thumbnails) that occurred on `target_date` in the given
    timezone. Empty lists when nothing of a type occurred.
    """
    tzinfo = _resolve_tz(tz)

    # Half-open UTC window [local_midnight, next_local_midnight) — keeps the WHERE
    # sargable against (user_id, completed_at) / (user_id, created_at) indexes.
    start_utc = datetime.combine(target_date, datetime.min.time(), tzinfo=tzinfo)
    end_utc = start_utc + timedelta(days=1)

    sessions = practice_repo.get_completed_sessions_in_range(user_id, start_utc, end_utc, session)
    analyses = analysis_repo.get_completed_analyses_in_range(user_id, start_utc, end_utc, session)

    return ActivityDayDetailDTO(
        date=target_date,
        sessions=_build_session_dtos(sessions, session),
        analyses=_build_analysis_dtos(analyses, session),
    )


# =========== HELPERS ===========

def _build_session_dtos(
    sessions: list[models.PracticeSession], session: Session
) -> list[ActivitySessionDTO]:
    if not sessions:
        return []

    session_ids = [s.id for s in sessions]
    drill_runs = practice_repo.get_practice_drill_runs_by_session_ids(session_ids, session)

    drill_ids = {run.drill_id for run in drill_runs}
    drills = drill_repo.get_drills_by_ids(list(drill_ids), session)
    drill_id_to_title = {drill.id: drill.title for drill in drills}

    runs_by_session: dict[UUID, list[ActivityDrillRunDTO]] = {}
    for run in drill_runs:
        runs_by_session.setdefault(run.session_id, []).append(
            ActivityDrillRunDTO(
                id=run.id,
                drill_id=run.drill_id,
                drill_title=drill_id_to_title.get(run.drill_id, "Unknown Drill"),
                successful_reps=run.successful_reps,
                failed_reps=run.failed_reps,
                skipped=run.skipped,
                started_at=run.started_at,
                completed_at=run.completed_at,
            )
        )

    return [
        ActivitySessionDTO(
            id=s.id,
            status=s.status,
            started_at=s.started_at,
            completed_at=s.completed_at,
            analysis_issue_id=s.analysis_issue_id,
            drill_runs=runs_by_session.get(s.id, []),
        )
        for s in sessions
    ]


def _build_analysis_dtos(
    analyses: list[models.Analysis], session: Session
) -> list[ActivityAnalysisDTO]:
    if not analyses:
        return []

    thumbnail_map = get_video_thumbnail_urls_from_analyses(
        [a.id for a in analyses], db_session=session
    ).thumbnail_urls

    return [
        ActivityAnalysisDTO(
            id=a.id,
            status=a.status,
            created_at=a.created_at,
            completed_at=a.completed_at,
            thumbnail_url=thumbnail_map.get(a.video_id),
        )
        for a in analyses
    ]
