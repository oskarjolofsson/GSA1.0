from sqlalchemy.orm import Session
from uuid import UUID

from core.infrastructure.db.repositories.issues import (
    get_issue_by_id as repo_get_issue_by_id,
    add_issue as repo_add_issue,
    set_issue_tags as repo_set_issue_tags,
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

from core.infrastructure.db.repositories import programs as programs_repo
from .dtos.issues_service_dto import CreateIssueDTO, UpdateIssueDTO, IssueResponseDTO
from core.services.exceptions import NotFoundException

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

    issue_fields = dict(
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
    created_issue = repo_add_issue(
        issue_fields,
        normalize_misses_strict(dto.misses, area),
        normalize_goals_strict(dto.goals),
        db_session,
    )
    return from_issue_to_response_dto(created_issue)


def get_issue_by_id(issue_id: UUID, user_id: UUID, db_session: Session) -> IssueResponseDTO | None:
    """Get an issue by its ID, with its analysis linkage for the user if there is one."""
    issue = repo_get_issue_by_id(issue_id, db_session)

    if not issue:
        raise NotFoundException(f"Issue with ID {issue_id} not found", str(issue_id))

    analysis_issue = repo_analysis_issues.get_analysis_issues_by_user_id_and_issue_id(user_id, issue_id, db_session)
    if analysis_issue:
        return from_issue_to_response_dto(issue, analysis_issue[0])
    return from_issue_to_response_dto(issue)


def get_all_issues(user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    issues = repo_get_all_issues(db_session)
    return [from_issue_to_response_dto(issue) for issue in issues]


def get_issues_by_drill_id(drill_id: UUID, user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues associated with a specific drill."""
    issues = repo_get_issues_by_drill_id(drill_id, db_session)
    return [from_issue_to_response_dto(issue) for issue in issues]


def get_issues_by_analysis_id(analysis_id: UUID, user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues associated with a specific analysis, with their analysis linkage."""
    issues = repo_get_issues_by_analysis_id(analysis_id, db_session)
    return _batch_fetch_analysis_issues(user_id, issues, db_session)


def get_issues_by_user_id(user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues created by a specific user with analysis_issue and
    program-status data.

    Each issue is annotated with its program status, then ordered
    active → not-started → completed; within a group by confidence then recency. So work
    the golfer has committed to floats to the top and finished issues sink.

    A golfer may hold several active programs at once (up to two per area), so the first
    group is now a set rather than a single focus. The ordering still holds -- it just
    ranks the active issues among themselves by confidence instead of naming one winner.
    """
    issues = repo_get_issues_by_user_id(user_id, db_session)
    dtos = _batch_fetch_analysis_issues(user_id, issues, db_session)

    # Custom (coach/browse) issues have no AnalysisIssue, so they don't come back
    # above — append them. They carry no analysis linkage.
    custom_issues = repo_get_custom_issues_by_user_id(user_id, db_session)
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
    """One issue to point the golfer at: the first element of the focus-ordered list.

    That is the highest-confidence issue with an active program, else the
    highest-priority not-started one, else the top completed one. None when the golfer
    has no issues at all.

    With several programs open this picks one of them by confidence, which is a
    tiebreaker rather than a considered answer to "what should I practise today". A real
    answer would weigh how long since each area was touched and where the golfer actually
    loses shots; that is the practice-diet work and it does not exist yet. Until it does,
    treat this as a suggestion and not a schedule -- callers wanting the full slate should
    read GET /programs/.
    """
    issues = get_issues_by_user_id(user_id, db_session)
    return issues[0] if issues else None


def _program_group(issue: IssueResponseDTO) -> int:
    """Ordering group: active (0) → not-started (1) → completed (2).

    Unchanged by multi-program: several issues can now share group 0, and they are ranked
    among themselves by confidence in the caller's sort.
    """
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
        IssueResponseDTO: The updated issue data.
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

    # Tags replace rather than merge: None leaves them, [] clears them. Already
    # validated above, so a bad tag never reaches the point of emptying the set.
    repo_set_issue_tags(issue, misses, goals, db_session)

    updated_issue = repo_update_issue(issue, db_session)
    
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


def from_issue_to_response_dto(issue, analysis_issue=None) -> IssueResponseDTO:
    """Transform an Issue object to IssueResponseDTO with optional analysis_issue data."""
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
        source=issue.source,
        goals=[g.goal for g in issue.goals],
        misses=[m.miss for m in issue.misses],
    )


def _batch_fetch_analysis_issues(user_id: UUID, issues: list, db_session: Session) -> list[IssueResponseDTO]:
    """Attach each issue's analysis linkage (analysis id, confidence) for this user."""
    issue_ids: list[UUID] = [issue.id for issue in issues]
    analysis_issues = repo_analysis_issues.get_analysis_issues_by_user_id_and_issue_ids(user_id=user_id, issue_ids=issue_ids, session=db_session)

    if not analysis_issues:
        return [from_issue_to_response_dto(issue) for issue in issues]

    analysis_issues_by_issue_id = {ai.issue_id: ai for ai in analysis_issues}

    # Deliberately unsorted. This used to order by a rep-based success rate derived
    # from `successful_reps`, which never held reps — it held a feel ordinal. The one
    # caller that cares about order (get_issues_by_user_id) re-sorts by focus anyway.
    return [
        from_issue_to_response_dto(issue, analysis_issues_by_issue_id.get(issue.id))
        for issue in issues
    ]