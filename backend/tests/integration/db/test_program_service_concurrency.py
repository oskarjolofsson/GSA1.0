"""T2: the authoritative, transaction-scoped free-tier focus cap.

Uses real, independently-committing sessions (not the rolled-back `db_session` fixture)
because the thing under test -- `pg_advisory_xact_lock` + `SELECT ... FOR UPDATE` closing
a TOCTOU race between two concurrent transactions -- only exists across separate
transactions on separate connections. A single rolled-back transaction can't reproduce it.

Rows this test commits are cleaned up explicitly in a `finally`, since they are not
covered by any test transaction rollback.
"""

from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import pytest

from core.infrastructure.db.session import SessionLocal
from core.infrastructure.db.models.Issue import Issue
from core.infrastructure.db.models.Analysis import Analysis
from core.infrastructure.db.models.AnalysisIssue import AnalysisIssue
from core.infrastructure.db.models.Program import Program
from core.infrastructure.db.repositories.issues import create_issue
from core.infrastructure.db.repositories.analysis import create_analysis
from core.infrastructure.db.repositories.analysis_issues import create_analysis_issue

from core.services import program_service as ps
from core.services import exceptions
from core.services.payment import entitlement_service


def _seed_two_issues_with_analyses(user_id):
    """Two separate issues (so the one-active-program-per-issue index cannot be what
    blocks the second insert), each reachable from its own analysis_issue owned by
    `user_id`. Committed on its own session so both worker threads see them."""
    session = SessionLocal()
    try:
        issue_a = create_issue(Issue(title="Race issue A", description="d"), session)
        issue_b = create_issue(Issue(title="Race issue B", description="d"), session)
        analysis = create_analysis(
            Analysis(user_id=user_id, model_version="v1", status="completed", success=True),
            session,
        )
        ai_a = create_analysis_issue(
            AnalysisIssue(analysis_id=analysis.id, issue_id=issue_a.id, confidence=0.9), session
        )
        ai_b = create_analysis_issue(
            AnalysisIssue(analysis_id=analysis.id, issue_id=issue_b.id, confidence=0.9), session
        )
        session.commit()
        return analysis.id, ai_a.id, ai_b.id, issue_a.id, issue_b.id
    finally:
        session.close()


def _cleanup(analysis_id, issue_ids, program_ids):
    session = SessionLocal()
    try:
        for pid in program_ids:
            program = session.get(Program, pid)
            if program is not None:
                session.delete(program)
        analysis = session.get(Analysis, analysis_id)
        if analysis is not None:
            session.delete(analysis)  # cascades its analysis_issues
        for iid in issue_ids:
            issue = session.get(Issue, iid)
            if issue is not None:
                session.delete(issue)
        session.commit()
    finally:
        session.close()


def _generate_in_own_session(user_id, analysis_issue_id):
    """Each worker gets its own connection/transaction, exactly like two concurrent HTTP
    requests each getting their own session from the dependency."""
    session = SessionLocal()
    try:
        result = ps.generate_program(user_id, session, analysis_issue_id=analysis_issue_id)
        session.commit()
        return ("ok", result)
    except exceptions.FocusLimitExceeded as e:
        session.rollback()
        return ("blocked", e)
    except Exception as e:  # surfaced to the test as a failure either way
        session.rollback()
        return ("error", e)
    finally:
        session.close()


def test_concurrent_generate_program_only_one_passes_the_free_tier_cap(test_user):
    user_id = test_user["user_id"]

    # This test is only meaningful for a genuinely unsubscribed user; a freshly created
    # test_user has no billing_customer/billing_subscription rows, so is_subscribed and
    # has_free_tier(profile just created, so within the 7-day window) may both be
    # relevant -- but _enforce_free_tier_focus_cap gates on is_subscribed specifically
    # (paid subscription), not the trial window, matching the router's own free-tier
    # notion of "no paid subscription". Skip defensively if that assumption ever changes.
    session = SessionLocal()
    try:
        if entitlement_service.is_subscribed(user_id, session):
            pytest.skip("test_user unexpectedly has an active subscription")
    finally:
        session.close()

    analysis_id, ai_a, ai_b, issue_a, issue_b = _seed_two_issues_with_analyses(user_id)
    program_ids = []
    try:
        with ThreadPoolExecutor(max_workers=2) as pool:
            fut_a = pool.submit(_generate_in_own_session, user_id, ai_a)
            fut_b = pool.submit(_generate_in_own_session, user_id, ai_b)
            outcome_a = fut_a.result(timeout=30)
            outcome_b = fut_b.result(timeout=30)

        outcomes = [outcome_a, outcome_b]
        kinds = [kind for kind, _ in outcomes]

        for kind, payload in outcomes:
            if kind == "ok":
                program_ids.append(payload.id)
            if kind == "error":
                raise AssertionError(f"unexpected error from generate_program: {payload!r}")

        assert kinds.count("ok") == 1, f"expected exactly one success, got {kinds}"
        assert kinds.count("blocked") == 1, f"expected exactly one FocusLimitExceeded, got {kinds}"
    finally:
        _cleanup(analysis_id, [issue_a, issue_b], program_ids)
