from datetime import datetime, timedelta
from types import SimpleNamespace
from uuid import uuid4

import pytest

from core.services.progress.analysis_issue_progress import Analysis_progress_service


def _build_completed_session(analysis_issue_id, completed_at):
    return SimpleNamespace(
        id=uuid4(),
        analysis_issue_id=analysis_issue_id,
        status="completed",
        started_at=completed_at - timedelta(minutes=10),
        completed_at=completed_at,
    )


def test_calculate_progress_computes_delta_from_latest_five_completed_sessions():
    analysis_issue_id = uuid4()
    analysis_issue = SimpleNamespace(id=analysis_issue_id)

    base = datetime(2026, 1, 1, 12, 0, 0)
    sessions = [
        _build_completed_session(analysis_issue_id, base + timedelta(days=i))
        for i in range(6)
    ]

    # Success rates by time (oldest -> newest):
    # 0.1, 0.2, 0.3, 0.4, 0.5, 0.6
    drill_runs = [
        SimpleNamespace(session_id=sessions[0].id, successful_reps=1, failed_reps=9),
        SimpleNamespace(session_id=sessions[1].id, successful_reps=2, failed_reps=8),
        SimpleNamespace(session_id=sessions[2].id, successful_reps=3, failed_reps=7),
        SimpleNamespace(session_id=sessions[3].id, successful_reps=4, failed_reps=6),
        SimpleNamespace(session_id=sessions[4].id, successful_reps=5, failed_reps=5),
        SimpleNamespace(session_id=sessions[5].id, successful_reps=6, failed_reps=4),
    ]

    service = Analysis_progress_service([analysis_issue], sessions, drill_runs)
    result = service.get_total_simple_progress()[0]

    assert result.completed_sessions == 6
    assert result.total_successful_reps == 21
    assert result.overall_success_rate == 0.35
    assert result.recent_session_success_rates == 0.4
    assert result.delta == pytest.approx(0.4)
    assert result.last_completed_at == sessions[5].completed_at


def test_calculate_progress_returns_none_delta_when_less_than_two_valid_session_rates():
    analysis_issue_id = uuid4()
    analysis_issue = SimpleNamespace(id=analysis_issue_id)

    base = datetime(2026, 1, 1, 12, 0, 0)
    session_with_no_reps = _build_completed_session(analysis_issue_id, base)
    valid_session = _build_completed_session(analysis_issue_id, base + timedelta(days=1))

    drill_runs = [
        SimpleNamespace(session_id=session_with_no_reps.id, successful_reps=0, failed_reps=0),
        SimpleNamespace(session_id=valid_session.id, successful_reps=3, failed_reps=1),
    ]

    service = Analysis_progress_service([analysis_issue], [session_with_no_reps, valid_session], drill_runs)
    result = service.get_total_simple_progress()[0]

    assert result.recent_session_success_rates == 0.75
    assert result.delta is None
