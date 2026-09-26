"""Format a real coach's lesson feedback into the app's Issue + Drill structure.

The AI's job here is formatting, NOT diagnosis: it must preserve the coach's own
explanations and wording as much as possible and only fill the structural fields
the practice engine needs (success_signal / fault_indicator) when the coach didn't
say them. Anything the AI inferred is flagged in `ai_filled` so the user can review
it. Nothing is persisted here.
"""

import json
from typing import Optional

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from core.services import taxonomy

# The vocabulary is deliberately NOT snapshotted at module import.
#
# It used to be: `_ALLOWED_MISSES = list(ALLOWED_MISSES)` at load time, interpolated into
# the instructions below. That broke in two ways once the taxonomy moved into the database:
#
#   1. A miss added from the admin dashboard never reached the model until a restart, so
#      the CMS silently did nothing for this path.
#   2. The prompt listed every miss across every area, so given chipping notes the model
#      would happily answer SLICE — which the area-scoped validator then rejects with a
#      422. A user-triggerable failure, in the paid tier, that reads as the AI being broken.
#
# Both go away by building the instructions per request, scoped to the target area.


def build_system_instructions(area: str) -> str:
    """The formatter instructions, with the tag vocabulary for one area only.

    Scoping matters: offering the model all ~40 misses and hoping it picks an in-area one
    is a worse contract than showing it the six that can possibly be right.
    """
    allowed_misses = list(taxonomy.misses_for(area))
    allowed_goals = list(taxonomy.allowed_goals())

    return f"""
You convert a golfer's notes from a real coaching lesson into a structured practice
focus. You are a FORMATTER, not a coach. Follow these rules exactly:

- Preserve the coach's explanations and wording verbatim wherever possible. Do not
  rephrase, upgrade, or "improve" their language. Copy their phrasing into the
  fields it fits.
- Produce ONE issue (the single thing to work on) and 1-3 drills.
- Each drill needs: title, task (what to physically do), success_signal (what a good
  rep looks/feels like), fault_indicator (how you know you slipped back into the
  fault).
- If the coach stated a field, use their words. If they did NOT state a field and you
  must infer it to make the drill runnable, write a minimal version AND add that
  field name to the drill's `ai_filled` list so the user knows to confirm it.
- This focus is for {area}. Tag the issue so a golfer can find it by symptom:
  * `miss` = what the golfer sees go wrong, one of {allowed_misses} or null. These are
    the only misses valid for {area} — do not use a term from another part of the game.
    Only set it if the feedback clearly implies one miss; otherwise null.
  * `goals` = why they'd practice this, a subset of {allowed_goals} (can be empty).
- Never invent drills the coach did not imply. Fewer, faithful drills beat more.
Return only JSON matching the provided schema.
""".strip()


class DraftDrill(BaseModel):
    title: str
    task: str
    success_signal: str
    fault_indicator: str
    ai_filled: list[str] = Field(
        default_factory=list,
        description="Names of fields the AI inferred rather than took from the coach.",
    )


class DraftIssue(BaseModel):
    title: str
    description: str
    miss: Optional[str] = None
    goals: list[str] = Field(default_factory=list)


class FeedbackDraft(BaseModel):
    issue: DraftIssue
    drills: list[DraftDrill] = Field(default_factory=list)


def _build_contents(text: str, image_bytes: Optional[bytes], image_mime: Optional[str]) -> list:
    parts: list = [{"text": f"Coach feedback:\n{text}"}]
    if image_bytes:
        parts.append({"inlineData": {"mimeType": image_mime or "image/jpeg", "data": image_bytes}})
    return [{"role": "user", "parts": parts}]


def structure_coach_feedback(
    client: genai.Client,
    text: str,
    model: str,
    image_bytes: Optional[bytes] = None,
    image_mime: Optional[str] = None,
    area: str = taxonomy.DEFAULT_AREA,
) -> dict:
    """Return a draft dict `{issue: {...}, drills: [...]}`. Raises ValueError on a
    missing model or an unparseable response.

    `area` scopes both the prompt and the output scrub. It defaults to full swing so every
    existing caller keeps working unchanged; the coach-feedback screen passes the real one
    once the user has picked where on the course this focus belongs.
    """
    if not model:
        raise ValueError("structure_coach_feedback requires an explicit model; none was provided")
    if not text or not text.strip():
        raise ValueError("structure_coach_feedback requires non-empty feedback text")

    # Built per request, not at import: the vocabulary lives in the database now, and this
    # is also where it gets narrowed to the misses valid for `area`.
    allowed_misses = list(taxonomy.misses_for(area))
    allowed_goals = list(taxonomy.allowed_goals())

    response = client.models.generate_content(
        model=model,
        config=types.GenerateContentConfig(
            system_instruction=[{"text": build_system_instructions(area)}],
            temperature=0.0,
            top_p=0.1,
            top_k=1,
            response_mime_type="application/json",
            response_json_schema=FeedbackDraft.model_json_schema(),
        ),
        contents=_build_contents(text, image_bytes, image_mime),
    )

    if not response or not response.text or not response.text.strip():
        raise ValueError("No response returned from Gemini API")

    try:
        data = json.loads(response.text.strip())
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON response: {str(e)}")

    # Validate/normalize through the schema (drops unknown keys, enforces shape).
    draft = FeedbackDraft.model_validate(data)
    # Drop tags outside the vocabulary so a bad AI value never reaches the foreign keys
    # (the service layer also re-normalizes defensively). Scoped to `area`, matching the
    # prompt: a miss from another part of the game is wrong here even though it exists,
    # and silently dropping it beats letting it 422 at the persistence layer.
    if draft.issue.miss is not None and draft.issue.miss.upper() not in allowed_misses:
        draft.issue.miss = None
    else:
        draft.issue.miss = draft.issue.miss.upper() if draft.issue.miss else None
    draft.issue.goals = [g.upper() for g in draft.issue.goals if g and g.upper() in allowed_goals]
    return draft.model_dump()
