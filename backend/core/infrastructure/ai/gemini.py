"""The only module that talks to Gemini.

Every AI job goes through here: one shared client, one way to ask for JSON, one way to
hand over a video. The jobs own their prompts and response schemas; this owns the call.
Tests replace `generate_json` or `client` here instead of patching each job's internals.
"""

import json
import logging
import time
from contextlib import contextmanager
from functools import lru_cache
from typing import Iterator

from google import genai
from google.genai import types

from core import config

from .errors import AIEmptyResponse, AIError, AIInvalidResponse, AITimeout, AIVideoRejected

logger = logging.getLogger(__name__)

# How long an uploaded video may stay in PROCESSING before we give up. The old poll had
# no limit, so a stuck upload held a worker forever.
VIDEO_READY_TIMEOUT_SECONDS = 120
_POLL_INTERVAL_SECONDS = 0.5


@lru_cache(maxsize=1)
def client() -> genai.Client:
    """The shared Gemini client, created on first use.

    One per process rather than one per request. genai.Client is safe to share across
    threads, which matters once analyses run in background tasks.
    """
    if not config.GEMINI_API_KEY:
        raise AIError("GEMINI_API_KEY is not set.")
    return genai.Client(api_key=config.GEMINI_API_KEY)


def generate_json(*, model: str, system_instruction: str, contents: list, schema: dict) -> dict:
    """Ask `model` for one JSON object matching `schema` and return it parsed.

    Deterministic settings for every job: these are classification and formatting
    tasks, not creative writing. Raises AIEmptyResponse or AIInvalidResponse rather than
    returning something the caller would have to second-guess.
    """
    if not model:
        raise AIError("A model is required; resolve one with get_model().")

    response = client().models.generate_content(
        model=model,
        config=types.GenerateContentConfig(
            system_instruction=[{"text": system_instruction}],
            temperature=0.0,
            top_p=0.1,
            top_k=1,
            response_mime_type="application/json",
            response_json_schema=schema,
        ),
        contents=contents,
    )

    text = (response.text or "").strip() if response else ""
    if not text:
        raise AIEmptyResponse("Gemini returned an empty response.")
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise AIInvalidResponse(f"Gemini returned invalid JSON: {e}") from e
    if not isinstance(data, dict):
        raise AIInvalidResponse(f"Gemini returned {type(data).__name__}, expected a JSON object.")
    return data


@contextmanager
def uploaded_video(
    path: str, timeout_seconds: float = VIDEO_READY_TIMEOUT_SECONDS
) -> Iterator[types.File]:
    """Upload a video, wait until Gemini can read it, and delete it again afterwards.

    Deletion runs however the block exits, so a failed analysis never leaves a copy of
    the golfer's video in Gemini's file store.
    """
    c = client()
    file = c.files.upload(file=path)
    try:
        deadline = time.monotonic() + timeout_seconds
        while True:
            state = c.files.get(name=file.name).state
            if state == "ACTIVE":
                break
            if state == "FAILED":
                raise AIVideoRejected("Gemini could not process the video.")
            if time.monotonic() >= deadline:
                raise AITimeout(f"Video was not ready after {timeout_seconds}s.")
            time.sleep(_POLL_INTERVAL_SECONDS)
        yield file
    finally:
        try:
            c.files.delete(name=file.name)
        except Exception:
            logger.warning("Failed to delete Gemini file %s", file.name, exc_info=True)


def video_part(file: types.File) -> dict:
    """The content part that points a request at an uploaded video."""
    return {"fileData": {"fileUri": file.uri}}
