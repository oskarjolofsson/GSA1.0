import uuid
from datetime import datetime, timezone, timedelta

from core.infrastructure.db.models.Analysis import Analysis
from core.infrastructure.db.models.Issue import Issue
from core.infrastructure.db.models.AnalysisIssue import AnalysisIssue
from core.infrastructure.db.models.Video import Video
from core.infrastructure.db.repositories.analysis import create_analysis
from core.infrastructure.db.repositories.issues import create_issue
from core.infrastructure.db.repositories.analysis_issues import create_analysis_issue
from core.services import analysis_service as svc


def _analysis(db, user_id, created_at):
    # Only completed+successful analyses surface in the timeline.
    video = Video(user_id=user_id, video_key="videos/x")
    db.add(video)
    db.flush()
    return create_analysis(
        Analysis(
            user_id=user_id,
            video_id=video.id,
            model_version="v1",
            status="completed",
            success=True,
            created_at=created_at,
        ),
        db,
    )


def _detect(db, analysis, issue, confidence):
    create_analysis_issue(
        AnalysisIssue(analysis_id=analysis.id, issue_id=issue.id, confidence=confidence), db
    )


def test_timeline_newest_first_with_confidence(db_session, test_user):
    issue = create_issue(Issue(title="Early extension", description="d"), db_session)
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)
    a_old = _analysis(db_session, test_user["user_id"], base)
    a_new = _analysis(db_session, test_user["user_id"], base + timedelta(days=10))
    _detect(db_session, a_old, issue, 0.9)
    _detect(db_session, a_new, issue, 0.4)

    items = svc.get_issue_swing_timeline(test_user["user_id"], issue.id, db_session)
    assert [i.analysis_id for i in items] == [a_new.id, a_old.id]
    assert items[0].confidence == 0.4 and items[0].detected
    assert items[1].confidence == 0.9 and items[1].detected


def test_timeline_includes_later_undetected_swing(db_session, test_user):
    """A swing after the issue was first detected, where the issue wasn't flagged,
    shows as detected=False (the 'likely improved' milestone)."""
    issue = create_issue(Issue(title="X", description="d"), db_session)
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)
    a_detect = _analysis(db_session, test_user["user_id"], base)
    a_clean = _analysis(db_session, test_user["user_id"], base + timedelta(days=20))
    _detect(db_session, a_detect, issue, 0.8)
    # a_clean is NOT linked to the issue.

    items = svc.get_issue_swing_timeline(test_user["user_id"], issue.id, db_session)
    by_id = {i.analysis_id: i for i in items}
    assert by_id[a_clean.id].detected is False
    assert by_id[a_clean.id].confidence is None
    assert by_id[a_detect.id].detected is True


def test_timeline_excludes_swings_before_first_detection(db_session, test_user):
    issue = create_issue(Issue(title="X", description="d"), db_session)
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)
    a_before = _analysis(db_session, test_user["user_id"], base)  # pre-issue, undetected
    a_detect = _analysis(db_session, test_user["user_id"], base + timedelta(days=5))
    _detect(db_session, a_detect, issue, 0.7)

    items = svc.get_issue_swing_timeline(test_user["user_id"], issue.id, db_session)
    ids = {i.analysis_id for i in items}
    assert a_detect.id in ids
    assert a_before.id not in ids


def test_timeline_empty_when_never_detected(db_session, test_user):
    assert svc.get_issue_swing_timeline(test_user["user_id"], uuid.uuid4(), db_session) == []
