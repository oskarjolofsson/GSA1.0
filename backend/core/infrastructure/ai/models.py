"""Single source of truth for which Gemini model runs the AI jobs.

Callers use get_model() rather than reading the config constant, so a future per-job or
admin-selected model is a change here only. create_analysis freezes the returned model
onto the Analysis row.
"""

from core import config


def get_model() -> str:
    """The model identifier every AI job runs with."""
    return config.AI_MODEL
