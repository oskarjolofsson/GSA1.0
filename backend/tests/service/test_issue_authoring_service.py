"""
Service-level tests for issue_authoring_service — the coach-feedback and browse
paths that let a golfer add their own issues/drills (not just AI video analysis).

These run against the real dev DB through `db_session` (a transaction that is
rolled back after each test, so nothing persists). The AI formatter is replaced
with a fake so no Gemini key or network call is needed — we are testing OUR
plumbing (draft assembly, dedup, persistence, program seeding, privacy scoping),
not the model.

What each class covers:
  * TestStructureFeedback  — turning coach text into a draft + dedup suggestions,
                             WITHOUT writing anything.
  * TestCreateCustomIssue  — persisting a confirmed custom issue and starting a
                             program from it (the "no source analysis" path).
  * TestBrowseCatalog      — the browseable library is scoped correctly (global
                             catalog + your own customs, never another user's).
"""
import uuid
import pytest

from core.infrastructure.db.models.Issue import Issue
from core.infrastructure.db import models
from core.infrastructure.db.repositories.issues import create_issue
from core.infrastructure.db.repositories import programs as programs_repo

from core.services import issue_authoring_service as ias
from core.services import issues_service as issvc
from core.services import program_service as ps
from core.services.dtos.issue_authoring_service_dto import DraftIssueDTO, DraftDrillDTO


def _fake_structurer(issue_title="Steep shaft in transition", drills=1):
    """Build a stand-in for the AI formatter (the `structurer` argument that
    structure_feedback accepts) so tests never hit Gemini. It returns the same
    dict shape the real `structure_coach_feedback` produces: an `issue` object and
    a list of `drills`, each drill carrying `ai_filled` (the field names the AI
    inferred rather than took verbatim from the coach). `drills=N` controls how
    many drills the fake returns; only the first drill marks a field as ai_filled."""
    def _s(text, image_bytes=None, image_mime=None):
        return {
            "issue": {
                "title": issue_title,
                "description": "Shaft steepens coming down; coach's words kept.",
                "miss": "SLICE",
                "goals": ["STRAIGHTER"],
            },
            "drills": [
                {
                    "title": f"Pump drill {i}",
                    "task": "Two slow pumps then hit.",
                    "success_signal": "Shaft shallows.",
                    "fault_indicator": "Handle drives out.",
                    "ai_filled": ["fault_indicator"] if i == 0 else [],
                }
                for i in range(drills)
            ],
        }
    return _s


class TestStructureFeedback:
    def test_returns_draft_shape(self, db_session, test_user):
        """Intent: structure_feedback takes the AI formatter's raw dict and turns it
        into a clean FeedbackDraftDTO the frontend can render and edit.

        We feed a fake that returns 2 drills, then assert the draft carries the
        issue title/tags through unchanged, has both drills, and preserves the
        `ai_filled` flag on the first drill (so the UI can mark that field as
        "AI-guessed, please confirm"). Nothing about the model is under test here —
        only that our mapping keeps every field intact."""
        draft = ias.structure_feedback(
            user_id=test_user["user_id"],
            text="You get steep in transition, do some pump drills",
            db_session=db_session,
            structurer=_fake_structurer(drills=2),
        )
        assert draft.issue.title == "Steep shaft in transition"
        # AI-emitted tags carry through so the issue is browseable from birth.
        assert draft.issue.miss == "SLICE"
        assert draft.issue.goals == ["STRAIGHTER"]
        assert draft.issue.area == "FULL_SWING"
        assert len(draft.drills) == 2
        assert draft.drills[0].ai_filled == ["fault_indicator"]

    def test_explicit_area_and_tags_round_trip(self, db_session, test_user):
        """A custom issue created with explicit area + miss/goal tags keeps them end-to-end."""
        created = ias.create_custom_issue(
            user_id=test_user["user_id"],
            issue=DraftIssueDTO(
                title="Chunked chips", description="hitting the ground first",
                area="CHIPPING", miss="FAT", goals=["CONTACT", "SHORT_GAME"],
            ),
            drills=[DraftDrillDTO(title="Ladder drill", task="t", success_signal="s", fault_indicator="f")],
            db_session=db_session,
        )
        assert created.area == "CHIPPING"
        assert created.misses == ["FAT"]
        assert set(created.goals) == {"CONTACT", "SHORT_GAME"}

    def test_dedup_surfaces_matching_catalog_issue(self, db_session, test_user):
        """Intent: before a golfer creates a brand-new custom issue, we check the
        existing catalog for something similar so they can reuse it instead of
        making a duplicate. structure_feedback should return those lookalikes in
        `similar_issues`.

        Setup: we insert a global catalog issue ("Steep transition move", user_id
        NULL) and then structure feedback whose draft title shares the distinctive
        words "steep"/"transition". The keyword dedup (ILIKE on those tokens) should
        find the catalog issue and return it as a suggestion. Assert its title is in
        the returned similar list."""
        # A catalog (user_id NULL) issue sharing a distinctive token should surface.
        create_issue(
            Issue(title="Steep transition move", description="shaft steepens"),
            db_session,
        )
        db_session.flush()
        draft = ias.structure_feedback(
            user_id=test_user["user_id"],
            text="steep transition",
            db_session=db_session,
            structurer=_fake_structurer(issue_title="Steep shaft transition"),
        )
        titles = [s.title for s in draft.similar_issues]
        assert "Steep transition move" in titles


class TestCreateCustomIssue:
    def test_persists_user_owned_issue_and_drills(self, db_session, test_user):
        """Intent: once the golfer confirms the draft, create_custom_issue writes a
        REAL, user-owned issue (source='custom') plus its drills, and that issue can
        then seed a practice program exactly like an AI-diagnosed one.

        Assertions: the returned issue is source='custom' with its 1 drill; and
        generating a program from its id produces an active program whose issue_id
        points at it, with analysis_issue_id None (there was no video analysis) and
        one drill state seeded (total_drills == 1). This is the core "coach feedback
        flows into the same engine" guarantee."""
        created = ias.create_custom_issue(
            user_id=test_user["user_id"],
            issue=DraftIssueDTO(title="My chicken wing", description="lead arm bends"),
            drills=[
                DraftDrillDTO(title="Towel drill", task="t", success_signal="s", fault_indicator="f"),
            ],
            db_session=db_session,
        )
        assert created.source == "custom"
        assert len(created.drills) == 1
        # No area supplied by the coach path -> defaults to full swing, never null.
        assert created.area == "FULL_SWING"

        # It's a real issue row owned by the user and can seed a program directly.
        program = ps.generate_program_from_issue(test_user["user_id"], created.id, db_session)
        assert program.status == "active"
        assert program.issue_id == created.id
        assert program.analysis_issue_id is None
        assert program.total_drills == 1

    def test_custom_program_retest_is_self_compare(self, db_session, test_user):
        """Intent: a retest step tells the golfer to re-film their swing. For an
        AI-diagnosed issue we can re-run the analysis and show an AI read as a
        reference. A CUSTOM issue (coach/browse) has no source video analysis, so
        its retest must degrade to a plain self-comparison ("film it and compare to
        your first clip") with no AI-read framing. This test proves that branch.

        Why the loop / fast-forward: the program schedules ONE step at a time, and
        a retest only appears after RETEST_CADENCE (6) work sessions. Rather than
        actually completing 6 sessions, we shortcut by inserting 6 already-completed
        "range" steps straight into the DB. That puts the scheduler in the state
        "6 work sessions done since the last retest", so the very next call to the
        internal scheduler (`_schedule_next_step`, called directly — this is a
        white-box test of that function) is forced to produce a retest.

        The two assertions:
          1. session_type == "retest"  -> we did reach a retest step.
          2. prescription["instruction"] == RETEST_INSTRUCTION_SELF  -> because the
             program's analysis_issue_id is None (custom), it used the self-compare
             copy, NOT the AI-reference copy (RETEST_INSTRUCTION).

        If this is the failing test, print `retest.prescription` and check whether
        analysis_issue_id on the program is actually None — the instruction is chosen
        off that field inside program_service._schedule_next_step."""
        from core.infrastructure.db.models.ProgramStep import ProgramStep

        created = ias.create_custom_issue(
            user_id=test_user["user_id"],
            issue=DraftIssueDTO(title="Sway off ball", description="hips slide"),
            drills=[DraftDrillDTO(title="Wall drill", task="t", success_signal="s", fault_indicator="f")],
            db_session=db_session,
        )
        program = ps.generate_program_from_issue(test_user["user_id"], created.id, db_session)

        # Fast-forward: inject RETEST_CADENCE completed work steps so the scheduler's
        # next decision is a retest (see docstring for why we don't play them out).
        for i in range(ps.RETEST_CADENCE):
            db_session.add(ProgramStep(
                program_id=program.id, order_index=i, session_type="range",
                prescription={}, status="completed",
            ))
        db_session.flush()

        retest = ps._schedule_next_step(program.id, db_session)
        assert retest.session_type == "retest"
        # Custom (no source analysis) => self-compare instruction, not the AI-read one.
        assert retest.prescription["instruction"] == ps.RETEST_INSTRUCTION_SELF

    def test_empty_title_rejected(self, db_session, test_user):
        """Intent: guard against junk. A custom issue with a blank/whitespace title
        is meaningless (it names the focus), so create_custom_issue must reject it
        with ValidationException rather than persist an untitled issue."""
        from core.services.exceptions import ValidationException
        with pytest.raises(ValidationException):
            ias.create_custom_issue(
                user_id=test_user["user_id"],
                issue=DraftIssueDTO(title="   ", description="x"),
                drills=[],
                db_session=db_session,
            )


class TestBrowseCatalog:
    def test_lists_global_and_own_custom_only(self, db_session, test_user):
        """Intent: the browse library must be privacy-scoped. A user should see the
        global admin catalog (user_id NULL) plus their OWN custom issues, but never
        another user's custom issues.

        Setup: one global issue (should appear) and one custom issue owned by a
        random other user_id (must NOT appear). Assert the global title is listed
        and the other user's secret title is not. This is the guard behind the
        "custom issues are private by default" decision."""
        # Global catalog issue (user_id NULL)
        create_issue(Issue(title="Global reverse pivot", description="d"), db_session)
        # Another user's custom issue must NOT appear
        other = Issue(title="Other user secret", description="d")
        other.user_id = uuid.uuid4()
        other.source = "custom"
        create_issue(other, db_session)
        db_session.flush()

        listed = ias.list_catalog_issues(test_user["user_id"], db_session)
        titles = {i.title for i in listed}
        assert "Global reverse pivot" in titles
        assert "Other user secret" not in titles


class TestCustomIssueVisibility:
    """The full-integration guarantee: a custom issue must be first-class in the
    home/practice surface, not just creatable. Without this a custom program is
    invisible on home and (via one-active-program) strands the user."""

    def test_custom_issue_appears_in_user_issue_list(self, db_session, test_user):
        """A custom issue has no AnalysisIssue, so the old analysis-join list would
        drop it. get_issues_by_user_id must now also return custom issues, tagged
        source='custom' with a null analysis_issue_id, and — once a program is
        started — annotated program_status='active' (keyed by program.issue_id)."""
        from core.services import issues_service

        created = ias.create_custom_issue(
            user_id=test_user["user_id"],
            issue=DraftIssueDTO(title="Cast from the top", description="early release"),
            drills=[DraftDrillDTO(title="Pump", task="t", success_signal="s", fault_indicator="f")],
            db_session=db_session,
        )
        ps.generate_program_from_issue(test_user["user_id"], created.id, db_session)

        dtos = issues_service.get_issues_by_user_id(test_user["user_id"], db_session)
        match = [d for d in dtos if str(d.id) == str(created.id)]
        assert match, "custom issue should appear in the user's issue list"
        assert match[0].source == "custom"
        assert match[0].analysis_issue_id is None
        assert match[0].program_status == "active"

    def test_todays_issue_is_the_active_custom_focus(self, db_session, test_user):
        """get_todays_issue is the head of the focus-ordered list, so an active
        custom program should surface as today's focus on home."""
        from core.services import issues_service

        created = ias.create_custom_issue(
            user_id=test_user["user_id"],
            issue=DraftIssueDTO(title="Reverse pivot", description="weight hangs back"),
            drills=[DraftDrillDTO(title="Step", task="t", success_signal="s", fault_indicator="f")],
            db_session=db_session,
        )
        ps.generate_program_from_issue(test_user["user_id"], created.id, db_session)

        todays = issues_service.get_todays_issue(test_user["user_id"], db_session)
        assert todays is not None and str(todays.id) == str(created.id)


class TestPracticeStartWithoutAnalysis:
    def test_range_session_starts_with_null_analysis_issue(self, db_session, test_user):
        """A custom issue's range session must start with analysis_issue_id=None
        (there is no source analysis). The program step carries the linkage, so the
        session itself needs no analysis issue."""
        from core.services import practice_session_service as pss

        session = pss.record_practice_session_start(
            user_id=test_user["user_id"],
            analysis_issue_id=None,
            session=db_session,
            session_type="range",
        )
        assert session.id is not None
        assert session.analysis_issue_id is None


class TestBrowseStartShowsOnHome:
    def test_browse_started_catalog_issue_appears_on_home(self, db_session, test_user):
        """Regression: starting a plan from the library uses a GLOBAL catalog issue
        (user_id NULL, source='catalog') — not analysis-linked, not custom. Home's
        issue list must still surface it via its program, or the user starts a focus
        and lands on the empty welcome screen (the bug this guards)."""
        uid = test_user["user_id"]
        # Clean slate: the "one active program at a time" guard would otherwise trip
        # on any active program left committed in the shared dev DB by earlier tests.
        db_session.query(models.Program).filter_by(user_id=uid, status="active").delete()
        db_session.flush()

        # A global catalog issue with one linked drill — exactly the browse case.
        issue = models.Issue(title="Browse home focus", description="d")
        db_session.add(issue)
        db_session.flush()
        drill = models.Drill(title="D", task="t", success_signal="s", fault_indicator="f")
        db_session.add(drill)
        db_session.flush()
        db_session.add(models.IssueDrill(issue_id=issue.id, drill_id=drill.id))
        db_session.flush()

        # Start a plan the way LibraryScreen does.
        program = ps.generate_program_from_issue(uid, issue.id, db_session)
        assert program.status == "active"

        # It must appear on home as the active focus.
        dtos = issvc.get_issues_by_user_id(uid, db_session)
        match = [d for d in dtos if d.id == issue.id]
        assert match, "browse-started catalog issue missing from home issue list"
        assert match[0].program_status == "active"

        today = issvc.get_todays_issue(uid, db_session)
        assert today is not None and today.id == issue.id


class TestRemoveFocus:
    def test_remove_browse_focus_deletes_program_keeps_shared_issue(self, db_session, test_user):
        """Browse: removing a focus on a GLOBAL catalog issue deletes the user's program
        (issue vanishes from home) but leaves the shared catalog issue intact."""
        uid = test_user["user_id"]
        db_session.query(models.Program).filter_by(user_id=uid, status="active").delete()
        db_session.flush()

        issue = models.Issue(title="Shared browse focus", description="d")
        db_session.add(issue)
        db_session.flush()
        drill = models.Drill(title="D", task="t", success_signal="s", fault_indicator="f")
        db_session.add(drill)
        db_session.flush()
        db_session.add(models.IssueDrill(issue_id=issue.id, drill_id=drill.id))
        db_session.flush()
        ps.generate_program_from_issue(uid, issue.id, db_session)

        ps.remove_focus_for_issue(uid, issue.id, db_session)

        # Program gone -> not on home.
        assert not programs_repo.get_programs_for_issue(uid, issue.id, db_session)
        assert all(d.id != issue.id for d in issvc.get_issues_by_user_id(uid, db_session))
        # Shared catalog issue still exists for everyone else.
        from core.infrastructure.db.repositories.issues import get_issue_by_id
        assert get_issue_by_id(issue.id, db_session) is not None

    def test_remove_custom_focus_deletes_issue_and_program(self, db_session, test_user):
        """Coach/custom: removing the focus deletes the user's own issue outright; its
        program cascades away."""
        uid = test_user["user_id"]
        db_session.query(models.Program).filter_by(user_id=uid, status="active").delete()
        db_session.flush()

        created = ias.create_custom_issue(
            user_id=uid,
            issue=DraftIssueDTO(title="My custom focus", description="mine"),
            drills=[DraftDrillDTO(title="D", task="t", success_signal="s", fault_indicator="f")],
            db_session=db_session,
        )
        ps.generate_program_from_issue(uid, created.id, db_session)

        ps.remove_focus_for_issue(uid, created.id, db_session)

        from core.infrastructure.db.repositories.issues import get_issue_by_id
        assert get_issue_by_id(created.id, db_session) is None
        assert not programs_repo.get_programs_for_issue(uid, created.id, db_session)

    def test_remove_others_custom_issue_forbidden(self, db_session, test_user):
        """Ownership: you cannot remove another user's custom issue."""
        import uuid as _uuid
        from core.services import exceptions
        other_issue = models.Issue(
            title="Someone else's focus", description="d", source="custom", user_id=_uuid.uuid4()
        )
        db_session.add(other_issue)
        db_session.flush()

        with pytest.raises(exceptions.ForbiddenException):
            ps.remove_focus_for_issue(test_user["user_id"], other_issue.id, db_session)
