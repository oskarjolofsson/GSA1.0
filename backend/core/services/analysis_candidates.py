"""The two pure steps around the v2 AI call: what it may choose from, and what of its
answer is kept.

    build_candidates   miss -> candidate laws -> each law's ranked issues in the area
    to_ai_context      candidates + the golfer's inputs -> the plain dict the AI layer takes
    validate_result    the AI's raw dict -> a law from the candidates, issues under it

Neither touches the AI, so both are tested without it. Whatever the model returns, only
a candidate law and issues under that law can reach the database.
"""

from uuid import UUID

from core.infrastructure.db.repositories import issues as issues_repo
from core.infrastructure.db.repositories import taxonomy as taxonomy_repo

from .dtos.analysis_v2_dto import (
    ChosenIssue,
    IssueCandidate,
    LawCandidate,
    ValidatedResult,
)
from .exceptions import InvalidStateException, InvalidVideoException

# Most issues one analysis keeps. Picking the one to focus on happens later, through
# the drills; this only bounds the shortlist.
MAX_ISSUES = 3

# Below this the AI is guessing. Same threshold the v1 prompt uses.
MIN_CONFIDENCE = 0.5


def build_candidates(area: str, miss: str, user_id: UUID, session) -> list[LawCandidate]:
    """
    Get the laws which are connected to the given miss. 
    These are coupled with the issues in the given area that break each law, ranked

    Raises InvalidStateException when nothing is left. Asking the AI to choose from an
    empty list would only produce an answer validation throws away, after a billed call.
    """
    laws = taxonomy_repo.list_laws_for_miss(miss, session) or taxonomy_repo.list_active_laws(session)

    issues_by_law: dict[str, list[IssueCandidate]] = {law.key: [] for law in laws}
    for link in issues_repo.get_ranked_issues_for_laws(list(issues_by_law), area, user_id, session):
        issues_by_law[link.law].append(
            IssueCandidate(
                issue_id=link.issue.id,
                rank=link.rank,
                title=link.issue.title,
                description=link.issue.description,
                current_motion=link.issue.current_motion,
                expected_motion=link.issue.expected_motion,
            )
        )

    candidates = [
        LawCandidate(
            key=law.key,
            label=law.label,
            golfer_label=law.golfer_label,
            blurb=law.blurb,
            issues=tuple(issues_by_law[law.key]),
        )
        for law in laws
        if issues_by_law[law.key]
    ]
    if not candidates:
        raise InvalidStateException(
            f"No issues in {area} are linked to the laws behind {miss}, so there is "
            "nothing to analyze against."
        )
    return candidates


def to_ai_context(
    candidates: list[LawCandidate],
    *,
    area: str,
    miss: str,
    notes: str | None,
    club_type: str | None,
    camera_view: str | None,
) -> dict:
    """The plain-data context ai.analyze_swing takes. The AI layer cannot import these
    DTOs, so the service hands it dicts; the limits travel with them so this module stays
    the one place that owns them."""
    return {
        "area": area,
        "miss": miss,
        "notes": notes,
        "club_type": club_type,
        "camera_view": camera_view,
        "max_issues": MAX_ISSUES,
        "min_confidence": MIN_CONFIDENCE,
        "laws": [
            {
                "key": law.key,
                "label": law.label,
                "golfer_label": law.golfer_label,
                "blurb": law.blurb,
                "issues": [
                    {
                        "issue_id": str(issue.issue_id),
                        "rank": issue.rank,
                        "title": issue.title,
                        "description": issue.description,
                        "current_motion": issue.current_motion,
                        "expected_motion": issue.expected_motion,
                    }
                    for issue in law.issues
                ],
            }
            for law in candidates
        ],
    }


def validate_result(raw: dict, candidates: list[LawCandidate]) -> ValidatedResult:
    """
    Validate the AI's raw result against the candidates it was given, keeping only what is
    allowed. Returns a law and its issues, ranked by confidence.

    Raises InvalidVideoException when the AI reports it could not analyze the video, and
    InvalidStateException when its law is not a candidate: without a valid law there is
    nothing to save.

    Issues are filtered rather than failed on, since one stray id should not throw away
    a good law: unknown ids, ids under another law, duplicates, non-numeric confidence
    and confidence below MIN_CONFIDENCE are dropped. Confidence is clamped to [0, 1].
    The rest is sorted by confidence, highest first (ties keep the AI's order), and
    capped at MAX_ISSUES. No issue left is still a valid result.
    """
    if not raw.get("success", False):
        raise InvalidVideoException(raw.get("error_message") or "The AI could not analyze the video.")

    law_key = str(raw.get("law") or "").strip().upper()
    law = next((c for c in candidates if c.key == law_key), None)
    if law is None:
        raise InvalidStateException(
            f"The AI chose law '{law_key}', which is not one of "
            f"{', '.join(c.key for c in candidates)}."
        )

    allowed = {i.issue_id for i in law.issues}
    kept: dict[UUID, float] = {}
    for item in raw.get("issues") or []:
        if not isinstance(item, dict):
            continue
        issue_id = _as_uuid(item.get("issue_id"))
        confidence = _as_confidence(item.get("confidence"))
        if issue_id not in allowed or issue_id in kept or confidence is None:
            continue
        if confidence >= MIN_CONFIDENCE:
            kept[issue_id] = confidence

    ranked = sorted(kept.items(), key=lambda pair: pair[1], reverse=True)[:MAX_ISSUES]
    return ValidatedResult(
        law=law.key,
        issues=tuple(ChosenIssue(issue_id=i, confidence=c) for i, c in ranked),
    )


def _as_uuid(value) -> UUID | None:
    try:
        return UUID(str(value))
    except (TypeError, ValueError):
        return None


def _as_confidence(value) -> float | None:
    if isinstance(value, bool):
        return None
    try:
        return min(max(float(value), 0.0), 1.0)
    except (TypeError, ValueError):
        return None
