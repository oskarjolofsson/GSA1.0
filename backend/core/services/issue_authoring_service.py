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


def _issue_to_catalog_dto(issue: models.Issue, session: Session) -> CatalogIssueDTO:
    drills = drill_repo.get_drills_by_issue_id(issue.id, session)
    return CatalogIssueDTO(
        id=issue.id,
        title=issue.title,
        description=issue.description,
        phase=issue.phase,
        area=getattr(issue, "area", "FULL_SWING"),
        source=issue.source,
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
        phase=issue.get("phase"),
        area=issue.get("area") or "FULL_SWING",
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
        similar_issues=[_issue_to_catalog_dto(i, db_session) for i in similar],
    )


def create_custom_issue(
    user_id: UUID,
    issue: DraftIssueDTO,
    drills: list[DraftDrillDTO],
    db_session: Session,
) -> CatalogIssueDTO:
    """Persist a user-owned issue + its drills + links. Does NOT start a program —
    the caller starts one via program_service.generate_program_from_issue(issue_id),
    exactly like the browse path."""
    if not issue.title.strip():
        from core.services.exceptions import ValidationException

        raise ValidationException("A custom issue needs a title.")

    new_issue = models.Issue(
        user_id=user_id,
        source="custom",
        title=issue.title.strip(),
        description=issue.description.strip(),
        phase=issue.phase,
        area=issue.area or "FULL_SWING",
    )
    issue_repo.create_issue(new_issue, db_session)

    for d in drills:
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

    return _issue_to_catalog_dto(new_issue, db_session)


def list_catalog_issues(user_id: UUID, db_session: Session) -> list[CatalogIssueDTO]:
    """The browseable library: global catalog + this user's custom issues, each with
    its drills."""
    issues = issue_repo.get_catalog_and_user_issues(user_id, db_session)
    return [_issue_to_catalog_dto(i, db_session) for i in issues]
