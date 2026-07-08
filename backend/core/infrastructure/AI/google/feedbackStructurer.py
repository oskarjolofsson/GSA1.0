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


_ALLOWED_PHASES = ["SETUP", "BACKSWING", "TRANSITION", "DOWNSWING", "IMPACT", "FOLLOW_THROUGH"]

STRUCTURE_SYSTEM_INSTRUCTIONS = f"""
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
- `phase` must be one of {_ALLOWED_PHASES} or null. Only set it if the feedback
  clearly points to one swing phase; otherwise null.
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
    phase: Optional[str] = None


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
) -> dict:
    """Return a draft dict `{issue: {...}, drills: [...]}`. Raises ValueError on a
    missing model or an unparseable response."""
    if not model:
        raise ValueError("structure_coach_feedback requires an explicit model; none was provided")
    if not text or not text.strip():
        raise ValueError("structure_coach_feedback requires non-empty feedback text")

    response = client.models.generate_content(
        model=model,
        config=types.GenerateContentConfig(
            system_instruction=[{"text": STRUCTURE_SYSTEM_INSTRUCTIONS}],
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
    if draft.issue.phase is not None and draft.issue.phase not in _ALLOWED_PHASES:
        draft.issue.phase = None
    return draft.model_dump()
