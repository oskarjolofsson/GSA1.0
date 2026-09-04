from core.infrastructure.db import models
from ..models.AnalysisIssue import AnalysisIssue
from ..models.IssueDrill import IssueDrill
from ..models.Analysis import Analysis
from sqlalchemy.orm import Session, selectinload
from uuid import UUID
from sqlalchemy import delete, select, func, or_

# Issue.goals/misses are lazy by default and every response DTO reads them, so
# without this each issue costs 2 extra queries. Apply to any read feeding a DTO.
_TAG_OPTS = (selectinload(models.Issue.goals), selectinload(models.Issue.misses))

# For reads whose DTO also carries the linked drills, loaded through the join rows.
# Kept separate from _TAG_OPTS so the home and analysis endpoints, which never render
# drills, don't pay for them.
_CATALOG_OPTS = _TAG_OPTS + (
    selectinload(models.Issue.issue_drills).selectinload(models.IssueDrill.drill),
)

# ------------ GET ------------


def get_issue_by_id(issue_id: UUID, session: Session) -> models.Issue:
    return session.get(models.Issue, issue_id, options=_TAG_OPTS)


def get_issues_by_ids(issue_ids: list[UUID], session: Session) -> list[models.Issue]:
    return (
        session.query(models.Issue)
        .filter(models.Issue.id.in_(issue_ids))
        .options(*_TAG_OPTS)
        .all()
    )


def get_all_issues(session: Session) -> list[models.Issue]:
    return session.query(models.Issue).options(*_TAG_OPTS).all()


def get_issues_by_analysis_id(analysis_id: UUID, session: Session) -> list[models.Issue]:
    """Get all issues associated with a specific analysis through the analysis_issues junction table."""
    return (
        session.query(models.Issue)
        .join(AnalysisIssue, models.Issue.id == AnalysisIssue.issue_id)
        .filter(AnalysisIssue.analysis_id == analysis_id)
        .options(*_TAG_OPTS)
        .all()
    )


def get_issues_by_drill_id(drill_id: UUID, session: Session) -> list[models.Issue]:
    """Get all issues associated with a specific drill through the issue_drill junction table."""
    return (
        session.query(models.Issue)
        .join(IssueDrill, models.Issue.id == IssueDrill.issue_id)
        .filter(IssueDrill.drill_id == drill_id)
        .options(*_TAG_OPTS)
        .all()
    )
    
    
def get_issues_by_user_id(user_id: UUID, session: Session) -> list[models.Issue]:
    return (session.query(models.Issue)
        .join(AnalysisIssue, models.Issue.id == AnalysisIssue.issue_id)
        .join(Analysis, AnalysisIssue.analysis_id == Analysis.id)
        .filter(
            (Analysis.user_id == user_id)
            & (AnalysisIssue.active == True)
            & (Analysis.status == "completed")
            & (Analysis.success == True)
        )
        .distinct()
        .options(*_TAG_OPTS)
        .all())
    
    
def get_unused_issues_of_user_id(user_id: UUID, session: Session) -> list[models.Issue]:
    # Subquery: get all active issues for this user
    active_issues = (
        session.query(AnalysisIssue.issue_id)
        .join(Analysis, AnalysisIssue.analysis_id == Analysis.id)
        .filter(
            (Analysis.user_id == user_id)
            & (AnalysisIssue.active == True)
            & (Analysis.status == "completed")
            & (Analysis.success == True)
        )
    )
    
    return (
        session.query(models.Issue)
        .filter(models.Issue.id.notin_(active_issues))
        .options(*_TAG_OPTS)
        .all()
    )


def get_custom_issues_by_user_id(user_id: UUID, session: Session) -> list[models.Issue]:
    """The user's own authored (custom) issues — the coach/browse-created ones that
    have no AnalysisIssue, so they don't come back from get_issues_by_user_id."""
    return (
        session.query(models.Issue)
        .filter(models.Issue.user_id == user_id, models.Issue.source == "custom")
        .options(*_TAG_OPTS)
        .all()
    )


def get_catalog_and_user_issues(user_id: UUID, session: Session) -> list[models.Issue]:
    """Browseable issues: the global admin catalog (user_id IS NULL) plus this
    user's own custom issues. A user never sees another user's custom issues."""
    return (
        session.query(models.Issue)
        .filter(or_(models.Issue.user_id.is_(None), models.Issue.user_id == user_id))
        .order_by(models.Issue.title)
        .options(*_CATALOG_OPTS)
        .all()
    )


def search_catalog_issues_by_text(
    tokens: list[str], session: Session, limit: int = 5
) -> list[models.Issue]:
    """Lightweight dedup: global catalog issues whose title or description matches
    any of the given tokens (case-insensitive). A pgvector semantic pass is a later
    upgrade; keyword ILIKE is enough to surface an obvious existing match."""
    tokens = [t for t in tokens if t]
    if not tokens:
        return []
    conds = []
    for token in tokens:
        like = f"%{token}%"
        conds.append(models.Issue.title.ilike(like))
        conds.append(models.Issue.description.ilike(like))
    return (
        session.query(models.Issue)
        .filter(models.Issue.user_id.is_(None))
        .filter(or_(*conds))
        .limit(limit)
        .options(*_CATALOG_OPTS)
        .all()
    )


# ------------ CREATE ------------


def create_issue(issue: models.Issue, session: Session) -> models.Issue:
    session.add(issue)
    session.flush()
    return issue


# ------------ UPDATE ------------


def update_issue(issue: models.Issue, session: Session) -> models.Issue:
    session.add(issue)
    session.flush()
    return issue


# ------------ DELETE ------------


def delete_issue(issue: models.Issue, session: Session) -> None:
    session.delete(issue)
    session.flush()


def delete_issues(issues: list[models.Issue], session: Session) -> None:
    stmt = delete(models.Issue).where(models.Issue.id.in_([issue.id for issue in issues]))
    session.execute(stmt)
    session.flush()


# ------------ COUNT ------------


def get_issue_count(session: Session) -> int:
    """Get total count of issues."""
    stmt = select(func.count()).select_from(models.Issue)
    return session.scalar(stmt) or 0


def get_issues_with_no_drills_count(session: Session) -> int:
    """Get count of issues that have no drill mappings."""
    subquery = select(IssueDrill.issue_id).distinct()
    stmt = (
        select(func.count())
        .select_from(models.Issue)
        .where(models.Issue.id.notin_(subquery))
    )
    return session.scalar(stmt) or 0

# ------------ ADMIN LIST ------------


def _admin_issue_filters(q, area, kind, source):
    """Filter clauses shared by the admin page query and its count.

    Kept in one place so the two can never disagree — a count built from
    different predicates than the page silently breaks pagination.
    """
    clauses = []
    if q:
        like = f"%{q}%"
        clauses.append(
            or_(
                models.Issue.title.ilike(like),
                models.Issue.description.ilike(like),
                models.Issue.layman_title.ilike(like),
            )
        )
    if area:
        clauses.append(models.Issue.area == area)
    if kind:
        clauses.append(models.Issue.kind == kind)
    if source:
        clauses.append(models.Issue.source == source)
    return clauses


def get_issues_page_admin(
    session: Session,
    *,
    limit: int,
    offset: int,
    q: str | None = None,
    area: str | None = None,
    kind: str | None = None,
    source: str | None = None,
) -> list[models.Issue]:
    """One page of issues for the admin content list, tags and drills included.

    Ordered newest-first with id as a tiebreaker: offset pagination over a
    non-deterministic sort skips and duplicates rows between pages, and created_at
    alone can tie.
    """
    stmt = (
        select(models.Issue)
        .where(*_admin_issue_filters(q, area, kind, source))
        .order_by(models.Issue.created_at.desc(), models.Issue.id)
        .limit(limit)
        .offset(offset)
        .options(*_CATALOG_OPTS)
    )
    return list(session.scalars(stmt).unique().all())


def count_issues_admin(
    session: Session,
    *,
    q: str | None = None,
    area: str | None = None,
    kind: str | None = None,
    source: str | None = None,
) -> int:
    stmt = (
        select(func.count())
        .select_from(models.Issue)
        .where(*_admin_issue_filters(q, area, kind, source))
    )
    return session.scalar(stmt) or 0


def get_issue_with_drills(issue_id: UUID, session: Session) -> models.Issue | None:
    """A single issue with tags and linked drills, for the admin detail view.

    populate_existing forces the eager loads to overwrite what is already in the
    identity map. Without it a re-read after attaching or detaching a drill returns
    the collection as it was when first loaded, and the caller sees a stale count.
    """
    stmt = (
        select(models.Issue)
        .where(models.Issue.id == issue_id)
        .options(*_CATALOG_OPTS)
        .execution_options(populate_existing=True)
    )
    return session.scalars(stmt).unique().one_or_none()
