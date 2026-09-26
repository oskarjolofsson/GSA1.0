"""The AI layer. Gemini only.

Services import from here, never from the modules underneath:

    get_model()                which model to run
    analyze_swing              v2 swing analysis: miss -> law -> issues
    analyze_video              v1 swing analysis, deleted with the v1 API
    structure_coach_feedback   coach lesson notes -> draft issue + drills
    AIError                    and its subclasses, what can go wrong

The jobs (swing analysis, coach feedback) join this surface as they move into the
package. Each job takes plain data and returns a checked dict; none touches the
database or the services.
"""

from .errors import AIEmptyResponse, AIError, AIInvalidResponse, AITimeout, AIVideoRejected
from .coach_feedback import structure_coach_feedback
from .models import get_model
from .swing_analysis import analyze_swing
from .swing_analysis_v1 import analyze_video

__all__ = [
    "analyze_swing",
    "analyze_video",
    "AIEmptyResponse",
    "AIError",
    "AIInvalidResponse",
    "AITimeout",
    "AIVideoRejected",
    "get_model",
    "structure_coach_feedback",
]
