from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.schemas.taxonomy import TaxonomyResponse
from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from core.services import taxonomy as taxonomy_service

router = APIRouter()


@router.get("/", response_model=TaxonomyResponse)
def get_taxonomy(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    The canonical practice-taxonomy vocabularies: areas, goals, misses, kinds — with the
    display labels each audience sees.

    Gated by `get_current_user`, not `require_admin`: both the admin dashboard and the
    golfer-facing app render tag pickers from this. Writes are a separate, admin-only
    surface under /admin/content/taxonomy/.

    Misses arrive twice — flat in `misses`, and grouped in `misses_by_area`. The grouped
    view is what the library navigates, since a miss belongs to exactly one area and the
    "which sounds like you?" step can only offer the right options once an area is chosen.
    """
    return TaxonomyResponse.from_vocabulary(taxonomy_service.get_vocabulary(db))
