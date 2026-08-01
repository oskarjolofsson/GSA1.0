from sqlalchemy.orm import Session
from uuid import UUID

from core.infrastructure.db.repositories.issues import (
    get_issue_by_id as repo_get_issue_by_id,
    create_issue as repo_create_issue,
    update_issue as repo_update_issue,
    delete_issue as repo_delete_issue,
    get_issues_by_analysis_id as repo_get_issues_by_analysis_id,
    get_issues_by_drill_id as repo_get_issues_by_drill_id,
    get_all_issues as repo_get_all_issues,
    get_issues_by_user_id as repo_get_issues_by_user_id,
    get_custom_issues_by_user_id as repo_get_custom_issues_by_user_id,
    get_issues_by_ids as repo_get_issues_by_ids,
    delete_issues as repo_delete_issues,
)
from core.infrastructure.db.repositories import analysis_issues as repo_analysis_issues

from core.infrastructure.db.repositories import practice_sessions as ps
from core.infrastructure.db.repositories import programs as programs_repo
from core.infrastructure.db.models.Issue import Issue
from core.infrastructure.db import models
from .dtos.issues_service_dto import CreateIssueDTO, UpdateIssueDTO, IssueResponseDTO, SimplifiedIssueProgressDTO
from core.services.exceptions import NotFoundException

from core.services.progress.analysis_issue_progress import Analysis_progress_service
from core.services import taxonomy
from core.services.taxonomy import (
    normalize_area_strict,
    normalize_goals_strict,
    normalize_kind_strict,
    normalize_misses_strict,
)


def create_issue(dto: CreateIssueDTO, db_session: Session) -> IssueResponseDTO:
    """Create a new issue."""
    # Resolved first because the miss tags below are validated against it: a miss belongs
    # to exactly one area, so SLICE on a putting issue is refused.
    area = normalize_area_strict(dto.area)

    new_issue = Issue(
        title=dto.title,
        description=dto.description,
        # Validated here rather than left to the foreign key, so a bad value is a 422
        # naming the field instead of an IntegrityError surfacing as a 500.
        area=area,
        kind=normalize_kind_strict(dto.kind),
        current_motion=dto.current_motion,
        expected_motion=dto.expected_motion,
        swing_effect=dto.swing_effect,
        shot_outcome=dto.shot_outcome,
        layman_title=dto.layman_title,
        layman_desc=dto.layman_desc,
    )
    # Strict normalizers (not the lenient ones used by issue_authoring_service):
    # this is an admin path, so an unknown tag is a 422 rather than a silent drop.
    for miss in normalize_misses_strict(dto.misses, area):
        new_issue.misses.append(models.IssueMiss(miss=miss))
    for goal in normalize_goals_strict(dto.goals):
        new_issue.goals.append(models.IssueGoal(goal=goal))

    created_issue = repo_create_issue(new_issue, db_session)
    return from_issue_to_response_dto(created_issue)


def get_issue_by_id(issue_id: UUID, user_id: UUID, db_session: Session) -> IssueResponseDTO | None:
    """Get an issue by its ID with optional analysis_issue and progress data for the user."""
    issue = repo_get_issue_by_id(issue_id, db_session)

    if not issue:
        raise NotFoundException(f"Issue with ID {issue_id} not found", str(issue_id))

    analysis_issue: models.AnalysisIssue = repo_analysis_issues.get_analysis_issues_by_user_id_and_issue_id(user_id, issue_id, db_session)
    if analysis_issue:
        progress: SimplifiedIssueProgressDTO = _get_progress_for_issues([analysis_issue[0]], db_session)[0]  # Get progress for this specific analysis issue
        return from_issue_to_response_dto(issue, analysis_issue[0], progress)
    return from_issue_to_response_dto(issue)


def get_all_issues(user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    issues: list[models.Issue] = repo_get_all_issues(db_session)
    return [from_issue_to_response_dto(issue) for issue in issues]


def get_issues_by_drill_id(drill_id: UUID, user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues associated with a specific drill with optional analysis_issue and progress data."""
    issues = repo_get_issues_by_drill_id(drill_id, db_session)
    return [from_issue_to_response_dto(issue) for issue in issues]


def get_issues_by_analysis_id(analysis_id: UUID, user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues associated with a specific analysis with optional analysis_issue and progress data."""
    issues = repo_get_issues_by_analysis_id(analysis_id, db_session)
    return _batch_fetch_analysis_issues_and_progress(user_id, issues, db_session)


def get_issues_by_user_id(user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues created by a specific user with analysis_issue, progress, and
    program-status data.

    Focus model (one program at a time): each issue is annotated with its program
    status, then ordered active → not-started → completed; within a group by
    confidence then recency. So the home opens on the current focus (the active
    program, or the highest-priority not-started issue), and finished issues sink.
    """
    issues: list[Issue] = repo_get_issues_by_user_id(user_id, db_session)
    dtos = _batch_fetch_analysis_issues_and_progress(user_id, issues, db_session)

    # Custom (coach/browse) issues have no AnalysisIssue, so they don't come back
    # above — append them. They carry no analysis-derived progress.
    custom_issues: list[Issue] = repo_get_custom_issues_by_user_id(user_id, db_session)
    dtos.extend(from_issue_to_response_dto(issue) for issue in custom_issues)

    # Annotate each issue with its program status (active wins over completed). Key
    # by the issue's own id via program.issue_id — works for AI and custom alike.
    programs = programs_repo.get_programs_by_user(user_id, db_session)
    status_by_issue: dict[str, str] = {}
    for program in programs:
        if program.issue_id is None:
            continue
        # Abandoned programs are a removed focus: they carry no status for the issue
        # and must not pull a removed issue back into the list via the backfill below.
        if program.status == "abandoned":
            continue
        key = str(program.issue_id)
        if key not in status_by_issue or program.status == "active":
            status_by_issue[key] = program.status

    # Browse path: a program can point at a GLOBAL catalog issue (user_id NULL, not
    # custom, no analysis link). Those issues aren't returned above, so pull them in
    # by their program's issue_id — otherwise a browse-started focus is invisible on
    # home and the user just sees the welcome screen.
    present_ids = {str(dto.id) for dto in dtos}
    missing_ids = [UUID(k) for k in status_by_issue if k not in present_ids]
    if missing_ids:
        extra_issues = repo_get_issues_by_ids(missing_ids, db_session)
        dtos.extend(from_issue_to_response_dto(issue) for issue in extra_issues)

    for dto in dtos:
        dto.program_status = status_by_issue.get(str(dto.id))

    # Stable multi-key sort: recency first (newest), then group + confidence.
    dtos.sort(key=lambda d: d.created_at or "", reverse=True)
    dtos.sort(key=lambda d: (_program_group(d), -(d.confidence if d.confidence is not None else 0.0)))
    return dtos


def get_todays_issue(user_id: UUID, db_session: Session) -> IssueResponseDTO | None:
    """The user's current focus issue: the active program's issue, else the
    highest-priority not-started issue, else the top completed one. This is just
    the first element of the focus-ordered list. None when the user has no issues.
    """
    issues = get_issues_by_user_id(user_id, db_session)
    return issues[0] if issues else None


def _program_group(issue: IssueResponseDTO) -> int:
    """Focus ordering group: active (0) → not-started (1) → completed (2)."""
    if issue.program_status == "active":
        return 0
    if issue.program_status == "completed":
        return 2
    return 1


def update_issue(issue_id: UUID, dto: UpdateIssueDTO, db_session: Session) -> IssueResponseDTO | None:
    """Update an existing issue.

    Args:
        issue_id (UUID): The ID of the issue to update.
        dto (UpdateIssueDTO): The data to update the issue with.

    Returns:
        IssueResponseDTO: The updated issue data with progress.
    """
    issue = repo_get_issue_by_id(issue_id, db_session)

    if not issue:
        raise NotFoundException(f"Issue with ID {issue_id} not found", str(issue_id))
    
    # Validate everything before touching the issue. The request transaction would
    # roll a half-applied update back anyway, but that only protects the database —
    # a caller that catches the exception and keeps using the session would still be
    # looking at an object carrying edits it was told were rejected.
    area = normalize_area_strict(dto.area) if dto.area is not None else None
    kind = normalize_kind_strict(dto.kind) if dto.kind is not None else None

    # Misses are validated against an area, and a PATCH may change one without the other.
    # Resolve which area applies before checking them:
    #
    #   misses only  ──▶ dto.area is None, so validate against the persisted issue's area
    #   both         ──▶ the request's area wins, misses checked against the new one
    #   area only    ──▶ see below: existing misses are pruned to the new area
    #
    # Falling back to "skip the check when area is absent" would put a hole through the
    # rule: create would refuse SLICE on a putting issue while edit quietly accepted it,
    # and the coverage grid would then report content its own navigation cannot reach.
    effective_area = area if area is not None else issue.area
    misses = (
        normalize_misses_strict(dto.misses, effective_area)
        if dto.misses is not None
        else None
    )
    goals = normalize_goals_strict(dto.goals) if dto.goals is not None else None

    # Moving an issue to a different area invalidates tags that only made sense in the old
    # one — a full-swing SLICE on an issue now filed under BUNKER. Prune them here.
    #
    # The admin form also clears them client-side, with a visible note, but a form is one
    # caller. Leaving this to the UI would let any other client (a script, a future mobile
    # editor, curl) create a row the coverage grid cannot display and the library cannot
    # navigate to — exactly the incoherence area scoping exists to prevent.
    #
    # Pruning rather than rejecting is deliberate: an admin correcting an issue's area
    # should not first have to hand-remove tags that the correction itself invalidates. The
    # response carries the reduced set, so nothing is hidden.
    if area is not None and area != issue.area and dto.misses is None:
        keep = set(taxonomy.misses_for(area))
        misses = [t.miss for t in issue.misses if t.miss in keep]

    # Only update fields that are provided
    if dto.title is not None:
        issue.title = dto.title
    if area is not None:
        issue.area = area
    if kind is not None:
        issue.kind = kind
    if dto.description is not None:
        issue.description = dto.description

    # Nullable text fields are three-state, same idea as the tag lists below:
    #
    #   None       ──▶ field absent from the request, leave it alone
    #   "" or "  " ──▶ caller cleared it, store NULL
    #   text       ──▶ store the trimmed text
    #
    # Without the empty case there is no way to remove copy once it exists: a blank
    # input would arrive as None and read as "untouched", so the field would silently
    # keep its old value while the caller was told the save succeeded. Whitespace is
    # trimmed first because a field holding only spaces reads as empty to whoever
    # sees it. title and description are NOT NULL and so stay two-state.
    for field in (
        "current_motion",
        "expected_motion",
        "swing_effect",
        "shot_outcome",
        "layman_title",
        "layman_desc",
    ):
        value = getattr(dto, field)
        if value is not None:
            setattr(issue, field, value.strip() or None)

    # Tags replace rather than merge: None leaves them, [] clears them. clear()
    # deletes the rows via delete-orphan. Already validated above, so a bad tag
    # never reaches the point of emptying the existing set.
    if misses is not None:
        issue.misses.clear()
        for miss in misses:
            issue.misses.append(models.IssueMiss(miss=miss))
    if goals is not None:
        issue.goals.clear()
        for goal in goals:
            issue.goals.append(models.IssueGoal(goal=goal))

    updated_issue = repo_update_issue(issue, db_session)
    
    # Note: update_issue doesn't have user_id context, so progress won't be included
    return from_issue_to_response_dto(updated_issue)


def delete_issue(issue_id: UUID, db_session: Session) -> None:
    """Delete an issue by its ID."""
    issue = repo_get_issue_by_id(issue_id, db_session)
    if not issue:
        raise NotFoundException(f"Issue ID not found", str(issue_id))
    repo_delete_issue(issue, db_session)


def delete_issues_bulk(issue_ids: list[UUID], db_session: Session) -> None:
    """Delete multiple issues by their IDs."""
    issues = repo_get_issues_by_ids(issue_ids, db_session)
    if len(issues) != len(issue_ids):
        raise NotFoundException(f"One or more issues not found", str(issue_ids))
    repo_delete_issues(issues, db_session)

# ------------ Helper Methods ------------


def from_issue_to_response_dto(issue: Issue, analysis_issue: models.AnalysisIssue | None = None, progress: SimplifiedIssueProgressDTO | None = None) -> IssueResponseDTO:
    """Transform an Issue object to IssueResponseDTO with optional analysis_issue and progress data."""
    return IssueResponseDTO(
        id=issue.id,
        title=issue.title,
        description=issue.description,
        current_motion=issue.current_motion,
        expected_motion=issue.expected_motion,
        swing_effect=issue.swing_effect,
        shot_outcome=issue.shot_outcome,
        created_at=issue.created_at.isoformat() if issue.created_at else None,
        area=issue.area,
        kind=issue.kind,
        layman_title=issue.layman_title,
        layman_desc=issue.layman_desc,
        analysis_issue_id=str(analysis_issue.id) if analysis_issue else None,
        analysis_id=str(analysis_issue.analysis_id) if analysis_issue else None,
        confidence=analysis_issue.confidence if analysis_issue else None,
        progress=progress,
        source=issue.source,
        goals=[g.goal for g in issue.goals],
        misses=[m.miss for m in issue.misses],
    )


def _get_progress_for_issues(analysis_issues: list[models.AnalysisIssue], db_session: Session) -> list[SimplifiedIssueProgressDTO]:
    """Fetch progress data for a list of analysis issues and return a mapping of issue_id to progress."""
    if not analysis_issues:
        return []
    
    practice_sessions: list[models.PracticeSession] = ps.get_practice_sessions_by_analysis_issue_ids([analysis_issue.id for analysis_issue in analysis_issues], db_session)
    drill_runs: list[models.PracticeDrillRun] = ps.get_practice_drill_runs_by_session_ids([session.id for session in practice_sessions], db_session)
    
    progress_service = Analysis_progress_service(
        analysis_issue=analysis_issues,
        practice_sessions=practice_sessions,
        drill_runs=drill_runs
    )
    
    progress_data: list[SimplifiedIssueProgressDTO] = progress_service.get_total_simple_progress()
    return progress_data


def _batch_fetch_analysis_issues_and_progress(user_id: UUID, issues: list[Issue], db_session: Session) -> list[IssueResponseDTO]:
    """Batch fetch analysis issues and progress data for a list of issues."""
    issue_ids: list[UUID] = [issue.id for issue in issues]
    analysis_issues: list[models.AnalysisIssue] = repo_analysis_issues.get_analysis_issues_by_user_id_and_issue_ids(user_id=user_id, issue_ids=issue_ids, session=db_session)
    progress_data: list[SimplifiedIssueProgressDTO] = _get_progress_for_issues(analysis_issues, db_session)
    
    if not analysis_issues or not progress_data:
        # If there are no analysis issues or progress data, we can return the issues without progress data
        return [from_issue_to_response_dto(issue) for issue in issues]

    analysis_issues_by_issue_id: dict[UUID, models.AnalysisIssue] = {ai.issue_id: ai for ai in analysis_issues}
    progress_by_issue_id: dict[UUID, SimplifiedIssueProgressDTO] = {ai.issue_id: p for ai, p in zip(analysis_issues, progress_data, strict=True)}

    return_li = [
        from_issue_to_response_dto(issue, analysis_issues_by_issue_id.get(issue.id), progress_by_issue_id.get(issue.id))
        for issue in issues
    ]
    
    return_li.sort(
        key=lambda x: (
            x.progress.overall_success_rate
            if x.progress and x.progress.overall_success_rate is not None
            else -1.0
        ),
        reverse=True,
    )
    return return_li