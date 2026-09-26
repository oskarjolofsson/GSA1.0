"""The AI layer. Gemini only.

Services import from here, never from the modules underneath:

    get_model()                which model to run
    structure_coach_feedback   coach lesson notes -> draft issue + drills
    AIError                    and its subclasses, what can go wrong

The jobs (swing analysis, coach feedback) join this surface as they move into the
package. Each job takes plain data and returns a checked dict; none touches the
database or the services.
"""

from .errors import AIEmptyResponse, AIError, AIInvalidResponse, AITimeout, AIVideoRejected
from .coach_feedback import structure_coach_feedback
from .models import get_model

__all__ = [
    "AIEmptyResponse",
    "AIError",
    "AIInvalidResponse",
    "AITimeout",
    "AIVideoRejected",
    "get_model",
    "structure_coach_feedback",
]
