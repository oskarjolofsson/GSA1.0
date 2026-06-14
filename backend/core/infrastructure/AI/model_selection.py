"""Single source of truth for which AI model runs an analysis.

Business logic (the analysis service) must call get_active_analysis_model()
instead of reading a config constant directly. This is the seam: today it
returns a config value; the day an admin board lands, only this function
changes to read the selected model from the DB (falling back to config).

    TODAY                          FUTURE (admin board)
    config.ANALYSIS_MODEL          db setting -> config.ANALYSIS_MODEL fallback
                 \\                 /
                  get_active_analysis_model()   <- callers never change
                              |
                  service.create_analysis (freezes it onto the Analysis row)
"""

from core import config


def get_active_analysis_model() -> str:
    """Return the model identifier to run new analyses with."""
    return config.ANALYSIS_MODEL
