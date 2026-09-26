"""What the AI layer raises. Services catch AIError and decide what the user sees."""


class AIError(Exception):
    """Anything that went wrong talking to Gemini."""


class AIEmptyResponse(AIError):
    """Gemini answered with nothing."""


class AIInvalidResponse(AIError):
    """Gemini answered, but not with the JSON object the job asked for."""


class AIVideoRejected(AIError):
    """Gemini could not process the uploaded video."""


class AITimeout(AIError):
    """Gemini took longer than we are willing to wait."""
