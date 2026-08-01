"""Author issues & drills outside the AI-video path.

Two new sources feed the same practice engine as AI analysis:
  * coach feedback -> AI *formats* (never diagnoses) into a draft Issue + Drills,
    the user reviews/edits, then it becomes a user-owned issue;
  * browse -> the user picks an existing catalog (or their own custom) issue.

Both end at program_service, which is source-agnostic.
"""

import re
from uuid import UUID

from sqlalchemy.orm import Session

from core.infrastructure.db import models
from core.infrastructure.db.repositories import issues as issue_repo
from core.infrastructure.db.repositories import drills as drill_repo
from core.infrastructure.db.repositories import issue_drills as issue_drill_repo
from core.infrastructure.AI.model_selection import get_active_analysis_model
from core.services.dtos.issue_authoring_service_dto import (
    DraftDrillDTO,
    DraftIssueDTO,
    CatalogDrillDTO,
    CatalogIssueDTO,
    FeedbackDraftDTO,
)
from core.services.exceptions import NotFoundException
from core.services.taxonomy import (
    DEFAULT_AREA,
    DEFAULT_KIND,
    normalize_area_strict,
    normalize_goals,
    normalize_goals_strict,
    normalize_kind_strict,
    normalize_miss,
    normalize_misses_strict,
)

# Tokens too generic to be useful for dedup matching.
_STOPWORDS = {
    "the", "and", "your", "you", "with", "for", "that", "this", "from", "into",
    "swing", "golf", "issue", "drill", "ball", "club", "when", "have", "get",
}


def _significant_tokens(text: str) -> list[str]:
    words = re.findall(r"[a-zA-Z]{4,}", (text or "").lower())
    seen: list[str] = []
    for w in words:
        if w not in _STOPWORDS and w not in seen:
            seen.append(w)
    return seen[:8]


def _default_structurer(text: str, image_bytes: bytes | None, image_mime: str | None) -> dict:
    """Lazily build the Google client so importing this module never needs an API
    key (tests inject a fake structurer instead)."""
    from core.infrastructure.AI.google.client import GoogleAnalysisClient

    return GoogleAnalysisClient().structure_coach_feedback(
        text=text,
        model=get_active_analysis_model(),
        image_bytes=image_bytes,
        image_mime=image_mime,
    )


def _issue_to_catalog_dto(issue: models.Issue) -> CatalogIssueDTO:
    # Walk the already-loaded join rows rather than making a per-issue repo call:
    # the issues repo eager-loads issue_drills and their drills, so mapping this
    # over a whole catalog stays flat instead of 1+N.
    drills = [link.drill for link in issue.issue_drills]
    return CatalogIssueDTO(
        id=issue.id,
        title=issue.title,
        description=issue.description,
        area=getattr(issue, "area", "FULL_SWING"),
        kind=getattr(issue, "kind", "fault"),
        source=issue.source,
        layman_title=issue.layman_title,
        layman_desc=issue.layman_desc,
        goals=[g.goal for g in issue.goals],
        misses=[m.miss for m in issue.misses],
        drills=[
            CatalogDrillDTO(
                id=d.id,
                title=d.title,
                task=d.task,
                success_signal=d.success_signal,
                fault_indicator=d.fault_indicator,
            )
            for d in drills
        ],
    )


def structure_feedback(
    user_id: UUID,
    text: str,
    db_session: Session,
    image_bytes: bytes | None = None,
    image_mime: str | None = None,
    structurer=None,
) -> FeedbackDraftDTO:
    """Format coach feedback into a draft (persists nothing) and attach any
    lookalike catalog issues so the user can reuse an existing definition instead."""
    structurer = structurer or _default_structurer
    raw = structurer(text=text, image_bytes=image_bytes, image_mime=image_mime)

    issue = raw.get("issue", {}) or {}
    draft_issue = DraftIssueDTO(
        title=issue.get("title", "").strip() or "Custom focus",
        description=issue.get("description", "").strip(),
        area=issue.get("area") or "FULL_SWING",
        kind=issue.get("kind") or "fault",
        # AI-emitted tags so a coach-created issue is browseable from birth.
        miss=normalize_miss(issue.get("miss")),
        goals=normalize_goals(issue.get("goals")),
    )
    draft_drills = [
        DraftDrillDTO(
            title=(d.get("title") or "").strip(),
            task=(d.get("task") or "").strip(),
            success_signal=(d.get("success_signal") or "").strip(),
            fault_indicator=(d.get("fault_indicator") or "").strip(),
            ai_filled=list(d.get("ai_filled") or []),
        )
        for d in (raw.get("drills") or [])
    ]

    tokens = _significant_tokens(f"{draft_issue.title} {draft_issue.description}")
    similar = issue_repo.search_catalog_issues_by_text(tokens, db_session, limit=5)

    return FeedbackDraftDTO(
        issue=draft_issue,
        drills=draft_drills,
        similar_issues=[_issue_to_catalog_dto(i) for i in similar],
    )


def persist_issue_with_drills(
    issue: DraftIssueDTO,
    new_drills: list[DraftDrillDTO],
    existing_drill_ids: list[UUID],
    user_id: UUID | None,
    source: str,
    strict_tags: bool,
    db_session: Session,
) -> CatalogIssueDTO:
    """Write an issue, its tags, any new drills and all the links, in one go.

    Shared by the user-authoring path and the admin catalog path, which differ only
    in ownership and how strictly tags are validated:

        user  -> user_id=<uid>, source="custom",  strict_tags=False
        admin -> user_id=None,  source="catalog", strict_tags=True

    Atomicity comes from the request session: every repo call flushes rather than
    commits, and app/dependencies/db.py commits once at the end or rolls back on any
    exception. A failure part-way through leaves no rows behind.

    `strict_tags` picks the validator. Lenient drops unknown values, which suits
    AI-generated input; strict raises 422 so an admin never sees a tag silently
    vanish. Does NOT start a program — callers use
    program_service.generate_program_from_issue(issue_id) for that.
    """
    from core.services.exceptions import ValidationException

    if not issue.title.strip():
        raise ValidationException("An issue needs a title.")

    raw_misses = issue.misses or ([issue.miss] if issue.miss else [])
    if strict_tags:
        # Area first: misses are validated against it, so a chipping issue cannot be
        # tagged with a full-swing ball flight.
        area = normalize_area_strict(issue.area)
        misses = normalize_misses_strict(raw_misses, area)
        goals = normalize_goals_strict(issue.goals)
        kind = normalize_kind_strict(issue.kind)
    else:
        # Lenient path: AI-generated input, where an unrecognised tag is dropped rather
        # than raised on. normalize_miss stays area-agnostic on purpose — a model that
        # returns a miss from the wrong area should lose that one tag, not fail the whole
        # request. The prompt is area-scoped upstream (feedbackStructurer) so this is a
        # backstop, not the primary defence.
        misses = [m for m in (normalize_miss(v) for v in raw_misses) if m]
        goals = normalize_goals(issue.goals)
        area = issue.area or DEFAULT_AREA
        kind = issue.kind or DEFAULT_KIND

    new_issue = models.Issue(
        user_id=user_id,
        source=source,
        title=issue.title.strip(),
        description=issue.description.strip(),
        area=area,
        kind=kind,
        layman_title=issue.layman_title,
        layman_desc=issue.layman_desc,
    )
    for miss_value in misses:
        new_issue.misses.append(models.IssueMiss(miss=miss_value))
    for goal in goals:
        new_issue.goals.append(models.IssueGoal(goal=goal))
    issue_repo.create_issue(new_issue, db_session)

    for d in new_drills:
        new_drill = models.Drill(
            user_id=user_id,
            title=d.title.strip(),
            task=d.task.strip(),
            success_signal=d.success_signal.strip(),
            fault_indicator=d.fault_indicator.strip(),
        )
        drill_repo.create_drill(new_drill, db_session)
        issue_drill_repo.create_issue_drill(
            models.IssueDrill(issue_id=new_issue.id, drill_id=new_drill.id),
            db_session,
        )

    for drill_id in existing_drill_ids or []:
        if drill_repo.get_drill_by_id(drill_id, db_session) is None:
            raise NotFoundException("Drill", str(drill_id))
        issue_drill_repo.create_issue_drill(
            models.IssueDrill(issue_id=new_issue.id, drill_id=drill_id),
            db_session,
        )

    return _issue_to_catalog_dto(new_issue)


def create_custom_issue(
    user_id: UUID,
    issue: DraftIssueDTO,
    drills: list[DraftDrillDTO],
    db_session: Session,
) -> CatalogIssueDTO:
    """Persist a user-owned issue + its drills + links."""
    return persist_issue_with_drills(
        issue=issue,
        new_drills=drills,
        existing_drill_ids=[],
        user_id=user_id,
        source="custom",
        strict_tags=False,
        db_session=db_session,
    )


def list_catalog_issues(user_id: UUID, db_session: Session) -> list[CatalogIssueDTO]:
    """The browseable library: global catalog + this user's custom issues, each with
    its drills."""
    issues = issue_repo.get_catalog_and_user_issues(user_id, db_session)
    return [_issue_to_catalog_dto(i) for i in issues]
