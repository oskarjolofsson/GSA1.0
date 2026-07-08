import uuid
import pytest

from core.infrastructure.db.models.Issue import Issue
from core.infrastructure.db.repositories.issues import create_issue
from core.infrastructure.db.repositories import programs as programs_repo

from core.services import issue_authoring_service as ias
from core.services import program_service as ps
from core.services.dtos.issue_authoring_service_dto import DraftIssueDTO, DraftDrillDTO


def _fake_structurer(issue_title="Steep shaft in transition", drills=1):
    """Stand in for the AI formatter so no API key/network is needed."""
    def _s(text, image_bytes=None, image_mime=None):
        return {
            "issue": {
                "title": issue_title,
                "description": "Shaft steepens coming down; coach's words kept.",
                "phase": "TRANSITION",
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
        draft = ias.structure_feedback(
            user_id=test_user["user_id"],
            text="You get steep in transition, do some pump drills",
            db_session=db_session,
            structurer=_fake_structurer(drills=2),
        )
        assert draft.issue.title == "Steep shaft in transition"
        assert draft.issue.phase == "TRANSITION"
        assert len(draft.drills) == 2
        assert draft.drills[0].ai_filled == ["fault_indicator"]

    def test_dedup_surfaces_matching_catalog_issue(self, db_session, test_user):
        # A catalog (user_id NULL) issue sharing a distinctive token should surface.
        create_issue(
            Issue(title="Steep transition move", description="shaft steepens", phase="TRANSITION"),
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
        created = ias.create_custom_issue(
            user_id=test_user["user_id"],
            issue=DraftIssueDTO(title="My chicken wing", description="lead arm bends", phase="IMPACT"),
            drills=[
                DraftDrillDTO(title="Towel drill", task="t", success_signal="s", fault_indicator="f"),
            ],
            db_session=db_session,
        )
        assert created.source == "custom"
        assert len(created.drills) == 1

        # It's a real issue row owned by the user and can seed a program directly.
        program = ps.generate_program_from_issue(test_user["user_id"], created.id, db_session)
        assert program.status == "active"
        assert program.issue_id == created.id
        assert program.analysis_issue_id is None
        assert program.total_drills == 1

    def test_custom_program_retest_is_self_compare(self, db_session, test_user):
        from core.infrastructure.db.models.ProgramStep import ProgramStep

        created = ias.create_custom_issue(
            user_id=test_user["user_id"],
            issue=DraftIssueDTO(title="Sway off ball", description="hips slide"),
            drills=[DraftDrillDTO(title="Wall drill", task="t", success_signal="s", fault_indicator="f")],
            db_session=db_session,
        )
        program = ps.generate_program_from_issue(test_user["user_id"], created.id, db_session)

        # Seed RETEST_CADENCE completed work steps so the next scheduled step is a retest.
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
