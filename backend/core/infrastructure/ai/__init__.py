"""The AI layer. Gemini only.

Services import from here, never from the modules underneath:

    get_model()   which model to run
    AIError       and its subclasses, what can go wrong

The jobs (swing analysis, coach feedback) join this surface as they move into the
package. Each job takes plain data and returns a checked dict; none touches the
database or the services.
"""

from .errors import AIEmptyResponse, AIError, AIInvalidResponse, AITimeout, AIVideoRejected
from .models import get_model

__all__ = [
    "AIEmptyResponse",
    "AIError",
    "AIInvalidResponse",
    "AITimeout",
    "AIVideoRejected",
    "get_model",
]
