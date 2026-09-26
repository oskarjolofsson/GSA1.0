"""Which issues analyze_video offers the model.

The issue list is sent to Gemini verbatim and the model may attach any issue on it to
the analysis. So it must hold the global catalog and the caller's own custom issues,
never another user's: those are private, and one landing on a stranger's analysis
would leak it onto their home screen too.

Gemini is mocked. What is under test is the prompt handed to it.
"""

import uuid
from types import SimpleNamespace
from unittest.mock import patch

import pytest

from ...core.infrastructure.ai.google import videoAnalyzer
from ...core.infrastructure.db.models.Issue import Issue
from ...core.infrastructure.db.repositories.issues import create_issue


def _prompt_for(db_session, user_id) -> str:
    """Run analyze_video with Gemini stubbed out and return the prompt text it built."""
    captured = {}

    def fake_call(client, contents, model):
        captured["prompt"] = contents[0]["parts"][0]["text"]
        raise RuntimeError("stop after the prompt is built")

    uploaded = SimpleNamespace(uri="stub", name="stub")
    with patch.object(videoAnalyzer, "_upload_and_wait", return_value=uploaded), \
         patch.object(videoAnalyzer, "_call_gemini_api", side_effect=fake_call), \
         pytest.raises(RuntimeError):
        videoAnalyzer.analyze_video(
            client=None,
            video_path="unused.mp4",
            user_id=user_id,
            model="test-model",
            db_session=db_session,
        )

    return captured["prompt"]


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

    prompt = _prompt_for(db_session, test_user["user_id"])

    assert str(catalog.id) in prompt
    assert str(own.id) in prompt
    assert str(someone_elses.id) not in prompt
