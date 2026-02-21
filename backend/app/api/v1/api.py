from fastapi import APIRouter
api_router = APIRouter()

# Include endpoint routers
from .endpoints import drill, feedback, user, analysis, issue

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