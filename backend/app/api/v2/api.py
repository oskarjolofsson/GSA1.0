from fastapi import APIRouter

from .endpoints import analysis

api_router = APIRouter()

# v2 of the analysis flow: structured inputs (area + miss), a background run and status
# polling. v1 stays mounted at /api/v1 for app builds that still use it.
api_router.include_router(
    router=analysis.router,
    prefix="/analyses",
    tags=["analyses v2"],
)
