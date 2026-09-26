"""Which issues v1 analysis offers the model.

The issue list is sent to Gemini verbatim and the model may attach any issue on it to
the analysis. So it must hold the global catalog and the caller's own custom issues,
never another user's: those are private, and one landing on a stranger's analysis
would leak it onto their home screen too.

The service builds the list and the AI layer only formats it, so this tests the
service's issues_offered_to_ai. Gemini is never called.
"""

import uuid

from core.infrastructure.db.models.Issue import Issue
from core.infrastructure.db.repositories.issues import create_issue
from core.services.analysis_service import issues_offered_to_ai


def _issue(db_session, *, user_id=None) -> Issue:
    return create_issue(
        Issue(
            title=f"Scope {uuid.uuid4().hex[:8]}",
            description="d",
            user_id=user_id,
            source="custom" if user_id else "catalog",
        ),
        db_session,
    )


def test_offers_catalog_and_own_issues_but_not_other_users(db_session, test_user, disposable_user):
    catalog = _issue(db_session)
    own = _issue(db_session, user_id=test_user["user_id"])
    someone_elses = _issue(db_session, user_id=disposable_user["user_id"])

    offered = {i["issue_id"] for i in issues_offered_to_ai(test_user["user_id"], db_session)}

    assert str(catalog.id) in offered
    assert str(own.id) in offered
    assert str(someone_elses.id) not in offered


def test_each_issue_carries_what_the_prompt_describes(db_session, test_user):
    issue = _issue(db_session)
    issue.current_motion, issue.expected_motion = "early release", "hold lag"
    db_session.flush()

    [offered] = [i for i in issues_offered_to_ai(test_user["user_id"], db_session) if i["issue_id"] == str(issue.id)]

    assert offered == {
        "issue_id": str(issue.id),
        "name": issue.title,
        "current motion that causes the issue": "early release",
        "desired motion that fixes the issue": "hold lag",
        "description of the issue": "d",
    }


def test_analyze_video_sends_the_offered_issues_and_the_video(db_session, test_user):
    """The v1 job formats what it is given and nothing else: no database read of its own."""
    from contextlib import contextmanager
    from types import SimpleNamespace
    from unittest.mock import patch

    from core.infrastructure.ai import gemini, swing_analysis_v1

    issue = _issue(db_session)
    offered = issues_offered_to_ai(test_user["user_id"], db_session)

    @contextmanager
    def fake_upload(path):
        assert path == "swing.mp4"
        yield SimpleNamespace(uri="https://gemini/abc", name="files/abc")

    with patch.object(gemini, "uploaded_video", fake_upload), \
         patch.object(gemini, "generate_json", return_value={"success": True}) as call:
        result = swing_analysis_v1.analyze_video(video_path="swing.mp4", issues=offered, model="m", misses="slice")

    kwargs = call.call_args.kwargs
    text, video = kwargs["contents"][0]["parts"]
    assert result == {"success": True}
    assert kwargs["system_instruction"] == swing_analysis_v1.SYSTEM_INSTRUCTIONS
    assert str(issue.id) in text["text"] and "slice" in text["text"]
    assert video == {"fileData": {"fileUri": "https://gemini/abc"}}
