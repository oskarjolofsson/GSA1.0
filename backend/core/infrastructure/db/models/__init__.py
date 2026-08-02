# Import Base first
from ..base import Base

# Import all models in order
# Import independent models first.
# Taxonomy tables lead: issues.area, issue_goals.goal and issue_misses.miss all point
# at them, so they have to be registered before those models resolve their FKs.
from .TaxonomyArea import TaxonomyArea
from .TaxonomyGoal import TaxonomyGoal
from .TaxonomyMiss import TaxonomyMiss
from .Profile import Profile
from .Video import Video
from .Drill import Drill
from .Issue import Issue
from .Analysis import Analysis
from .Role import Role
from .BillingCustomer import BillingCustomer
from .BillingSubscription import BillingSubscription
from .ProcessedWebhookEvent import ProcessedWebhookEvent
#from .Feedback import Feedback

# Import junction/association tables last (models that depend on others)
from .AnalysisIssue import AnalysisIssue
from .IssueDrill import IssueDrill
from .IssueGoal import IssueGoal
from .IssueMiss import IssueMiss
from .UserRole import UserRole

# Import practice tracking models
from .PracticeSession import PracticeSession
from .PracticeDrillRun import PracticeDrillRun

# Import program engine models
from .Program import Program
from .ProgramStep import ProgramStep
from .ProgramDrillState import ProgramDrillState

# Export all models
__all__ = [
    "Base",
    "TaxonomyArea",
    "TaxonomyGoal",
    "TaxonomyMiss",
    "Profile",
    "Video",
    "Drill",
    "Issue",
    "Analysis",
    "Role",
    "BillingCustomer",
    "BillingSubscription",
    "ProcessedWebhookEvent",
    "Feedback",
    "AnalysisIssue",
    "IssueDrill",
    "IssueGoal",
    "IssueMiss",
    "UserRole",
    "PracticeSession",
    "PracticeDrillRun",
    "Program",
    "ProgramStep",
    "ProgramDrillState",
]
