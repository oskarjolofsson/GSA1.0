"""Single source of truth for which AI model runs an analysis.

Callers must use get_active_analysis_model() rather than reading a config constant, so
that the day an admin board lands only this function changes. create_analysis freezes
the returned model onto the Analysis row.
"""

from core import config


def get_active_analysis_model() -> str:
    """Return the model identifier to run new analyses with."""
    return config.ANALYSIS_MODEL
