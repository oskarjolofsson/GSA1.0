import os

# Single source of truth for the API version. Bump this on meaningful changes.
__version__ = "5.0.0"

# Deploy-time git commit SHA. Set GIT_COMMIT (or GIT_SHA) as an env var during
# your build/deploy so you can verify exactly which code is live without having
# to remember to bump __version__.
GIT_COMMIT = os.getenv("GIT_COMMIT") or os.getenv("GIT_SHA") or "unknown"
