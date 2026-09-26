"""Live v2 swing analysis against the real Gemini model. Runs only with --run-ai.

Hand-made candidates with fixed ids, so no database is read or written. What is under
test is that the real model's answer survives the service's validation, and that a
non-golf video is refused.
"""

import uuid

from core.infrastructure.ai import analyze_swing, get_model
from core.services.analysis_candidates import to_ai_context, validate_result
from core.services.dtos.analysis_v2_dto import IssueCandidate, LawCandidate

CANDIDATES = [
    LawCandidate(
        key="FACE", label="Face", golfer_label="Where the clubface points",
        blurb="Open or closed to the path at impact, sets start line and curve",
        issues=(
            IssueCandidate(uuid.uuid4(), 1, "Open clubface at impact",
                           "The face points right of the path when the ball is struck.",
                           "Cupped lead wrist at the top", "Flat lead wrist at the top"),
            IssueCandidate(uuid.uuid4(), 2, "Weak grip",
                           "Hands turned toward the target, making it hard to square the face.",
                           "Lead hand knuckles hidden", "Two to three knuckles visible"),
        ),
    ),
    LawCandidate(
        key="PATH", label="Path", golfer_label="Which way the club swings",
        blurb="In-to-out or out-to-in through impact",
        issues=(
            IssueCandidate(uuid.uuid4(), 1, "Over the top",
                           "The club moves outside the hands in transition and swings across the ball.",
                           "Shoulders start the downswing", "Lower body starts the downswing"),
        ),
    ),
]


def _analyze(video_path: str) -> dict:
    context = to_ai_context(
        CANDIDATES, area="FULL_SWING", miss="SLICE", notes=None,
        club_type="driver", camera_view=None,
    )
    return analyze_swing(video_path=video_path, context=context, model=get_model())


def test_golf_swing_answer_passes_validation(gemini_api_key, test_video_path):
    raw = _analyze(test_video_path[0])

    assert raw["observation"]
    result = validate_result(raw, CANDIDATES)
    assert result.law in {"FACE", "PATH"}


def test_non_golf_video_is_refused(gemini_api_key, test_video_path):
    raw = _analyze(test_video_path[1])

    assert raw["success"] is False
