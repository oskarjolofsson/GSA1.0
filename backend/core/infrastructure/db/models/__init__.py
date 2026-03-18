# Import Base first
from ..base import Base

# Import all models in order
# Import independent models first
from .Profile import Profile
from .Video import Video
from .Drill import Drill
from .Issue import Issue
from .Analysis import Analysis
from .Role import Role
#from .Feedback import Feedback

# Import junction/association tables last (models that depend on others)
from .AnalysisIssue import AnalysisIssue
from .IssueDrill import IssueDrill
from .UserRole import UserRole

# Import practice tracking models
from .PracticeSession import PracticeSession
from .PracticeDrillRun import PracticeDrillRun

# Export all models
__all__ = [
    "Base",
    "Profile",
    "Video",
    "Drill",
    "Issue",
    "Analysis",
    "Role",
    "Feedback",
    "AnalysisIssue",
    "IssueDrill",
    "UserRole",
    "PracticeSession",
    "PracticeDrillRun",
]
