# Import Base first
from ..base import Base

# Import all models in order
# Import independent models first
from .Profile import Profile
from .MandatoryConsent import MandatoryConsent
from .Video import Video
from .Drill import Drill
from .Issue import Issue
from .Analysis import Analysis
from .Role import Role
from .Permission import Permission
#from .Feedback import Feedback

# Import junction/association tables last (models that depend on others)
from .UserConsent import UserConsent
from .AnalysisIssue import AnalysisIssue
from .IssueDrill import IssueDrill
from .UserRole import UserRole
from .RolePermission import RolePermission

# Export all models
__all__ = [
    "Base",
    "Profile",
    "MandatoryConsent",
    "Video",
    "Drill",
    "Issue",
    "Analysis",
    "Role",
    "Permission",
    "Feedback",
    "UserConsent",
    "AnalysisIssue",
    "IssueDrill",
    "UserRole",
    "RolePermission",
]
