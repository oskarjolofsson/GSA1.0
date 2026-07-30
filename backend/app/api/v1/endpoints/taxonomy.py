from fastapi import APIRouter, Depends

from app.api.v1.schemas.taxonomy import TaxonomyResponse
from app.dependencies.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=TaxonomyResponse)
def get_taxonomy(current_user: dict = Depends(get_current_user)):
    """
    The canonical practice-taxonomy vocabularies: areas, misses, goals, kinds.

    Gated by `get_current_user` rather than `require_admin`: this is public
    vocabulary that both the admin dashboard and the golfer-facing app need. The
    admin renders its tag pickers from this response so it can never offer a value
    that the strict validators on POST/PATCH /issues/ would reject.

    Takes no database session — the values are module constants.
    """
    return TaxonomyResponse.from_taxonomy()
