"""build_candidates and validate_result: the two pure steps around the v2 AI call.

The build tests use their own TEST_* area, miss and laws, so links a coach made under
the real ones can never change the outcome. The validate tests need no database.
"""

import uuid

import pytest

from core.infrastructure.db import models
from core.infrastructure.db.repositories.issues import create_issue
from core.services.analysis_candidates import (
    MAX_ISSUES,
    build_candidates,
    validate_result,
)
from core.services.dtos.analysis_v2_dto import IssueCandidate, LawCandidate
from core.services.exceptions import InvalidStateException, InvalidVideoException


# ------------------------------ build_candidates ------------------------------


@pytest.fixture()
def vocab(db_session):
    """TEST_AREA with TEST_MISS in it, and three laws of our own."""
    db_session.add(models.TaxonomyArea(key="TEST_AREA", label="t", golfer_label="t"))
    db_session.flush()
    db_session.add(models.TaxonomyMiss(key="TEST_MISS", area="TEST_AREA", label="t", golfer_label="t"))
    for key in ("TEST_LAW_A", "TEST_LAW_B", "TEST_LAW_C"):
        db_session.add(models.TaxonomyLaw(key=key, label=key, golfer_label=key))
    db_session.flush()


def _map(session, miss, law, rank):
    session.add(models.TaxonomyMissLaw(miss=miss, law=law, rank=rank))
    session.flush()


def _issue_under(session, law, rank, *, area="TEST_AREA") -> models.Issue:
    issue = create_issue(
        models.Issue(title=f"Issue {uuid.uuid4().hex[:8]}", description="d", area=area),
        session,
    )
    session.add(models.IssueLaw(issue_id=issue.id, law=law, rank=rank))
    session.flush()
    return issue


class TestBuildCandidates:
    def test_laws_follow_the_miss_ranking_and_issues_the_law_ranking(self, db_session, test_user, vocab):
        _map(db_session, "TEST_MISS", "TEST_LAW_B", 1)
        _map(db_session, "TEST_MISS", "TEST_LAW_A", 2)
        b1 = _issue_under(db_session, "TEST_LAW_B", 1)
        a2 = _issue_under(db_session, "TEST_LAW_A", 2)
        a1 = _issue_under(db_session, "TEST_LAW_A", 1)

        candidates = build_candidates("TEST_AREA", "TEST_MISS", test_user["user_id"], db_session)

        assert [c.key for c in candidates] == ["TEST_LAW_B", "TEST_LAW_A"]
        assert [i.issue_id for i in candidates[0].issues] == [b1.id]
        assert [(i.issue_id, i.rank) for i in candidates[1].issues] == [(a1.id, 1), (a2.id, 2)]

    def test_carries_what_the_prompt_needs(self, db_session, test_user, vocab):
        _map(db_session, "TEST_MISS", "TEST_LAW_A", 1)
        issue = _issue_under(db_session, "TEST_LAW_A", 1)
        issue.current_motion, issue.expected_motion = "early release", "hold lag"
        db_session.flush()

        [law] = build_candidates("TEST_AREA", "TEST_MISS", test_user["user_id"], db_session)

        assert (law.label, law.golfer_label) == ("TEST_LAW_A", "TEST_LAW_A")
        assert (law.issues[0].title, law.issues[0].current_motion, law.issues[0].expected_motion) == (
            issue.title, "early release", "hold lag",
        )

    def test_mapped_law_without_issues_in_the_area_is_dropped(self, db_session, test_user, vocab):
        _map(db_session, "TEST_MISS", "TEST_LAW_A", 1)
        _map(db_session, "TEST_MISS", "TEST_LAW_B", 2)
        _issue_under(db_session, "TEST_LAW_A", 1, area="FULL_SWING")
        _issue_under(db_session, "TEST_LAW_B", 1)

        candidates = build_candidates("TEST_AREA", "TEST_MISS", test_user["user_id"], db_session)

        assert [c.key for c in candidates] == ["TEST_LAW_B"]

    def test_unmapped_miss_falls_back_to_every_active_law(self, db_session, test_user, vocab):
        """A new miss works before a coach links it to any law."""
        _issue_under(db_session, "TEST_LAW_C", 1)

        candidates = build_candidates("TEST_AREA", "TEST_MISS", test_user["user_id"], db_session)

        assert [c.key for c in candidates] == ["TEST_LAW_C"]

    def test_nothing_to_choose_from_raises(self, db_session, test_user, vocab):
        """No billed AI call against an empty list."""
        with pytest.raises(InvalidStateException, match="TEST_MISS"):
            build_candidates("TEST_AREA", "TEST_MISS", test_user["user_id"], db_session)


# ------------------------------ validate_result ------------------------------


FACE_1, FACE_2, FACE_3, FACE_4 = (uuid.uuid4() for _ in range(4))
PATH_1 = uuid.uuid4()

CANDIDATES = [
    LawCandidate(
        key="FACE", label="Face", golfer_label="f", blurb=None,
        issues=tuple(
            IssueCandidate(issue_id=i, rank=r, title="t", description="d")
            for r, i in enumerate((FACE_1, FACE_2, FACE_3, FACE_4), start=1)
        ),
    ),
    LawCandidate(
        key="PATH", label="Path", golfer_label="p", blurb=None,
        issues=(IssueCandidate(issue_id=PATH_1, rank=1, title="t", description="d"),),
    ),
]


def _raw(law="FACE", issues=(), **extra) -> dict:
    return {"success": True, "law": law, "issues": list(issues), **extra}


def _pick(issue_id, confidence=0.8) -> dict:
    return {"issue_id": str(issue_id), "confidence": confidence}


class TestValidateResultLaw:
    def test_candidate_law_is_kept(self):
        assert validate_result(_raw("PATH"), CANDIDATES).law == "PATH"

    def test_law_is_case_insensitive(self):
        assert validate_result(_raw(" face "), CANDIDATES).law == "FACE"

    @pytest.mark.parametrize("law", ["SPEED", "", None])
    def test_law_outside_the_candidates_fails(self, law):
        with pytest.raises(InvalidStateException):
            validate_result(_raw(law), CANDIDATES)

    def test_ai_reporting_failure_fails(self):
        with pytest.raises(InvalidVideoException, match="too dark"):
            validate_result({"success": False, "error_message": "too dark"}, CANDIDATES)

    def test_missing_success_flag_counts_as_failure(self):
        with pytest.raises(InvalidVideoException):
            validate_result({"law": "FACE", "issues": []}, CANDIDATES)


class TestValidateResultIssues:
    def test_sorted_by_confidence_highest_first(self):
        result = validate_result(_raw(issues=[_pick(FACE_1, 0.6), _pick(FACE_2, 0.9)]), CANDIDATES)

        assert [(i.issue_id, i.confidence) for i in result.issues] == [(FACE_2, 0.9), (FACE_1, 0.6)]

    def test_ties_keep_the_ai_order(self):
        result = validate_result(_raw(issues=[_pick(FACE_3, 0.7), _pick(FACE_1, 0.7)]), CANDIDATES)

        assert [i.issue_id for i in result.issues] == [FACE_3, FACE_1]

    def test_capped_at_max_issues_keeping_the_most_confident(self):
        picks = [_pick(FACE_1, 0.6), _pick(FACE_2, 0.9), _pick(FACE_3, 0.8), _pick(FACE_4, 0.7)]

        result = validate_result(_raw(issues=picks), CANDIDATES)

        assert len(result.issues) == MAX_ISSUES == 3
        assert [i.issue_id for i in result.issues] == [FACE_2, FACE_3, FACE_4]

    def test_issue_under_another_law_is_dropped(self):
        """PATH_1 is a real candidate, but not under the law the AI chose."""
        result = validate_result(_raw(issues=[_pick(PATH_1), _pick(FACE_1)]), CANDIDATES)

        assert [i.issue_id for i in result.issues] == [FACE_1]

    @pytest.mark.parametrize("bad_id", [str(uuid.uuid4()), "not-a-uuid", None, 42])
    def test_unknown_or_malformed_id_is_dropped(self, bad_id):
        result = validate_result(_raw(issues=[{"issue_id": bad_id, "confidence": 0.9}]), CANDIDATES)

        assert result.issues == ()

    def test_duplicate_keeps_the_first(self):
        result = validate_result(_raw(issues=[_pick(FACE_1, 0.6), _pick(FACE_1, 0.9)]), CANDIDATES)

        assert [(i.issue_id, i.confidence) for i in result.issues] == [(FACE_1, 0.6)]

    def test_below_threshold_is_dropped(self):
        result = validate_result(_raw(issues=[_pick(FACE_1, 0.49), _pick(FACE_2, 0.5)]), CANDIDATES)

        assert [i.issue_id for i in result.issues] == [FACE_2]

    def test_confidence_above_one_is_clamped(self):
        result = validate_result(_raw(issues=[_pick(FACE_1, 1.7)]), CANDIDATES)

        assert result.issues[0].confidence == 1.0

    @pytest.mark.parametrize("confidence", ["high", None, True, float("nan")])
    def test_non_numeric_confidence_is_dropped(self, confidence):
        result = validate_result(_raw(issues=[_pick(FACE_1, confidence)]), CANDIDATES)

        assert result.issues == ()

    def test_numeric_string_confidence_is_accepted(self):
        result = validate_result(_raw(issues=[_pick(FACE_1, "0.8")]), CANDIDATES)

        assert result.issues[0].confidence == 0.8

    @pytest.mark.parametrize("issues", [[], None, ["garbage"]])
    def test_no_valid_issue_still_returns_the_law(self, issues):
        """Decided: the analysis completes with the law alone."""
        result = validate_result({"success": True, "law": "FACE", "issues": issues}, CANDIDATES)

        assert (result.law, result.issues) == ("FACE", ())
