from fastapi import APIRouter
api_router = APIRouter()

# Include endpoint routers
from .endpoints import drill, feedback, user, analysis, issue, issue_drill, admin

api_router.include_router(
    router=admin.router,
    prefix="/admin",
    tags=["admin"],
)

api_router.include_router(
    router=drill.router,
    prefix="/drills",
    tags=["drills"],
)

api_router.include_router(
    router=feedback.router,
    prefix="/feedback",
    tags=["feedback"],
)

api_router.include_router(
    router=user.router,
    prefix="/users",
    tags=["users"],
)

api_router.include_router(
    router=analysis.router,
    prefix="/analyses",
    tags=["analyses"],
)

api_router.include_router(
    router=issue.router,
    prefix="/issues",
    tags=["issues"],
)

api_router.include_router(
    router=issue_drill.router,
    prefix="/issue-drills",
    tags=["issue-drills"],
)
