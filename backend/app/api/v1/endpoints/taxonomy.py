from fastapi import APIRouter, Depends

from app.api.v1.schemas.taxonomy import TaxonomyResponse
from app.dependencies.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=TaxonomyResponse)
def get_taxonomy(current_user: dict = Depends(get_current_user)):
    """
    The canonical practice-taxonomy vocabularies: areas, misses, goals, kinds.

    Gated by `get_current_user`, not `require_admin` — both the admin dashboard and
    the golfer-facing app render tag pickers from this.
    """
    return TaxonomyResponse.from_taxonomy()
