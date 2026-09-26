"""The v2 analysis flow: structured inputs, a background run, status polling.

    create_analysis_v2     check area + miss, create the rows, hand out an upload URL
    start_analysis         check the upload, claim the analysis, return straight away
    execute_analysis       the background job: video -> law -> issues, completed or failed
    get_analysis_status    what the client polls; also fails a job that died
    get_analysis_details   the result, once completed

v1 lives on in analysis_service.py and shares the tables. A v2 analysis is one whose
prompt has an area.
"""

import logging
import os
import tempfile
from datetime import datetime, timedelta, timezone
from uuid import UUID

from core.infrastructure import ai
from core.infrastructure.db.repositories.analysis import (
    add_analysis,
    claim_for_processing,
    commit_failed_state,
    fail_if_stale,
    get_analysis_by_id,
    get_analysis_with_details,
)
from core.infrastructure.db.repositories.analysis_issues import (
    add_analysis_issue,
    delete_analysis_issues_by_analysis_id,
)
from core.infrastructure.db.repositories.prompts import add_prompt, get_prompt_by_analysis_id
from core.infrastructure.db.repositories.videos import add_video, get_video_by_id, set_video_keys
from core.infrastructure.db.session import SessionLocal
from core.infrastructure.storage.r2Adaptor import (
    generate_upload_url,
    get_object,
    object_exists,
    put_object,
)
from core.services.payment import entitlement_service

from . import taxonomy
from .analysis_candidates import build_candidates, to_ai_context, validate_result
from .analysis_common import load_owned_analysis, make_thumbnail_jpeg
from .dtos.analysis_v2_dto import (
    AnalysisDetailsDTO,
    AnalysisDrillDTO,
    AnalysisIssueDetailDTO,
    AnalysisStatusDTO,
    CreateAnalysisV2DTO,
    CreatedAnalysisDTO,
)
from .exceptions import ConflictException, InvalidStateException, ServiceException, ValidationException

logger = logging.getLogger(__name__)

# A job still processing after this is dead: its worker was restarted or crashed.
STALE_AFTER = timedelta(minutes=10)

# The notes go into the prompt verbatim. Bounded so one request cannot bloat it.
MAX_NOTES_LENGTH = 1000
MAX_CLUB_TYPE_LENGTH = 50


# ------------------------------ create ------------------------------


def create_analysis_v2(dto: CreateAnalysisV2DTO, db_session) -> CreatedAnalysisDTO:
    """Create the video, analysis and prompt rows and return where to upload the video.

    Raises ValidationException (422) on an unknown area or camera view, a miss that is
    missing, unknown or from another area, or notes / club type over their limit.
    """
    area = taxonomy.normalize_area_strict(dto.area)
    misses = taxonomy.normalize_misses_strict([dto.miss], area)
    if not misses:
        raise ValidationException("A miss is required.")
    camera_view = taxonomy.normalize_camera_view_optional(dto.camera_view)
    notes = _optional_text(dto.notes, MAX_NOTES_LENGTH, "Notes")
    club_type = _optional_text(dto.club_type, MAX_CLUB_TYPE_LENGTH, "Club type")

    video = add_video({"user_id": dto.user_id}, db_session)
    analysis = add_analysis(
        {
            "user_id": dto.user_id,
            "model_version": ai.get_model(),
            "video_id": video.id,
            "status": "awaiting_upload",
        },
        db_session,
    )
    add_prompt(
        {
            "analysis_id": analysis.id,
            "area": area,
            "miss": misses[0],
            "notes": notes,
            "club_type": club_type,
            "camera_view": camera_view,
        },
        db_session,
    )

    video_key = f"videos/{video.id}"
    set_video_keys(video, video_key, f"thumbnails/{video.id}.jpg", db_session)
    return CreatedAnalysisDTO(analysis_id=analysis.id, upload_url=generate_upload_url(key=video_key))


# ------------------------------ start ------------------------------


def start_analysis(analysis_id: UUID, user_id: UUID, db_session) -> None:
    """Move an uploaded analysis to processing. The caller then schedules execute_analysis.

    Raises ConflictException (409) when it is not a v2 analysis, is not awaiting upload,
    has no video in storage yet, or loses the race to a concurrent start.

    Commits before returning. The background job runs on its own session and must see
    `processing`; left to the request's commit, it could start first and find
    `awaiting_upload`.
    """
    analysis = load_owned_analysis(analysis_id, user_id, db_session)

    prompt = get_prompt_by_analysis_id(analysis.id, db_session)
    if prompt is None or prompt.area is None:
        raise ConflictException("This analysis was not created through v2 and cannot be started here.")
    if analysis.status != "awaiting_upload":
        raise ConflictException(f"Analysis is already {analysis.status}.")

    video = get_video_by_id(analysis.video_id, db_session)
    if video is None or not object_exists(video.video_key):
        raise ConflictException("The video has not been uploaded yet.")

    if not claim_for_processing(analysis.id, db_session):
        raise ConflictException("Analysis was already started.")
    db_session.commit()


# ------------------------------ execute (background) ------------------------------


def execute_analysis(analysis_id: UUID, session_factory=SessionLocal) -> None:
    """Run one claimed analysis to completed or failed. Never raises.

    Runs after the response is sent, so there is no request session and no one to
    raise to: it opens its own session, and every failure ends as a `failed` row with a
    message the client can show. `session_factory` exists for tests.
    """
    with session_factory() as session:
        try:
            _run(analysis_id, session)
            session.commit()
        except Exception as e:
            session.rollback()
            logger.exception("Analysis %s failed", analysis_id)
            _record_failure(analysis_id, e, session)


def _run(analysis_id: UUID, session) -> None:
    analysis = get_analysis_by_id(analysis_id, session)
    if analysis is None or analysis.status != "processing":
        return  # Already finished, or never claimed. Nothing to do.

    prompt = get_prompt_by_analysis_id(analysis.id, session)
    if prompt is None or prompt.area is None or prompt.miss is None:
        raise InvalidStateException("This analysis has no area and miss to analyze against.")

    # Before the download and the billed call: an area with nothing authored fails fast.
    candidates = build_candidates(prompt.area, prompt.miss, analysis.user_id, session)

    video = get_video_by_id(analysis.video_id, session)
    with tempfile.TemporaryDirectory() as tmp_dir:
        video_path = os.path.join(tmp_dir, "swing.mp4")
        with open(video_path, "wb") as f:
            f.write(get_object(video.video_key))

        _upload_thumbnail(video_path, video.thumbnail_key)

        raw = ai.analyze_swing(
            video_path=video_path,
            context=to_ai_context(
                candidates,
                area=prompt.area,
                miss=prompt.miss,
                notes=prompt.notes,
                club_type=prompt.club_type,
                camera_view=prompt.camera_view,
            ),
            model=analysis.model_version,
        )

    result = validate_result(raw, candidates)

    # Checked right before the result is written: the AI call can outlast a subscription.
    if not entitlement_service.is_subscribed(analysis.user_id, session):
        raise InvalidStateException("Subscription required to complete this analysis.")

    analysis.law = result.law
    for issue in result.issues:
        add_analysis_issue(analysis.id, issue.issue_id, issue.confidence, session)
    analysis.status = "completed"
    analysis.success = True
    analysis.completed_at = datetime.now(timezone.utc)
    session.flush()


def _upload_thumbnail(video_path: str, thumbnail_key: str) -> None:
    """A thumbnail failure must not fail the analysis; the client shows a placeholder."""
    try:
        put_object(key=thumbnail_key, data=make_thumbnail_jpeg(video_path), content_type="image/jpeg")
    except Exception:
        logger.warning("Failed to generate thumbnail %s", thumbnail_key, exc_info=True)


def _record_failure(analysis_id: UUID, error: Exception, session) -> None:
    """Mark the analysis failed, with no issues, unless it has already moved on."""
    try:
        analysis = get_analysis_by_id(analysis_id, session)
        if analysis is None or analysis.status != "processing":
            return
        delete_analysis_issues_by_analysis_id(analysis_id, session)
        commit_failed_state(analysis, _user_facing_message(error), session)
    except Exception:
        logger.exception("Could not record the failure of analysis %s", analysis_id)


def _user_facing_message(error: Exception) -> str:
    """Our own exceptions say what went wrong in words fit for the client. Anything else
    may carry SQL or a stack detail, so it stays in the log."""
    if isinstance(error, (ServiceException, ai.AIError)):
        return str(error)
    return "The analysis failed. Please try again."


# ------------------------------ read ------------------------------


def get_analysis_status(analysis_id: UUID, user_id: UUID, db_session) -> AnalysisStatusDTO:
    """What the client polls. A job processing past STALE_AFTER is marked failed here,
    since nothing else would ever move it."""
    analysis = load_owned_analysis(analysis_id, user_id, db_session)
    if analysis.status == "processing" and fail_if_stale(analysis.id, STALE_AFTER, db_session):
        db_session.refresh(analysis)
    return AnalysisStatusDTO(
        analysis_id=analysis.id, status=analysis.status, error_message=analysis.error_message
    )


def get_analysis_details(analysis_id: UUID, user_id: UUID, db_session) -> AnalysisDetailsDTO:
    """The finished result. Raises ConflictException (409) until the analysis completed."""
    load_owned_analysis(analysis_id, user_id, db_session)
    analysis = get_analysis_with_details(analysis_id, db_session)
    if analysis.status != "completed":
        raise ConflictException(f"Analysis is {analysis.status}, not completed.")

    prompt = analysis.prompt
    issues = sorted(
        (ai_issue for ai_issue in analysis.issues if ai_issue.active),
        key=lambda ai_issue: ai_issue.confidence or 0.0,
        reverse=True,
    )
    return AnalysisDetailsDTO(
        analysis_id=analysis.id,
        video_id=analysis.video_id,
        status=analysis.status,
        area=prompt.area if prompt else None,
        miss=prompt.miss if prompt else None,
        notes=prompt.notes if prompt else None,
        club_type=prompt.club_type if prompt else None,
        camera_view=prompt.camera_view if prompt else None,
        law=analysis.law,
        issues=tuple(_issue_detail(ai_issue) for ai_issue in issues),
        created_at=analysis.created_at,
        completed_at=analysis.completed_at,
    )


# ------------------------------ helpers ------------------------------


def _issue_detail(analysis_issue) -> AnalysisIssueDetailDTO:
    issue = analysis_issue.issue
    return AnalysisIssueDetailDTO(
        analysis_issue_id=analysis_issue.id,
        issue_id=issue.id,
        title=issue.title,
        description=issue.description,
        layman_title=issue.layman_title,
        layman_desc=issue.layman_desc,
        confidence=analysis_issue.confidence,
        drills=tuple(
            AnalysisDrillDTO(
                drill_id=link.drill.id,
                title=link.drill.title,
                task=link.drill.task,
                success_signal=link.drill.success_signal,
                fault_indicator=link.drill.fault_indicator,
            )
            for link in issue.issue_drills
        ),
    )


def _optional_text(value: str | None, max_length: int, label: str) -> str | None:
    text = (value or "").strip() or None
    if text is not None and len(text) > max_length:
        raise ValidationException(f"{label} can be at most {max_length} characters.")
    return text
