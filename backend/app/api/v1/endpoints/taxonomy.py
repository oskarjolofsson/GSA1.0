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
    Get the taxonomy vocabulary for the current user.
    
    This endpoint retrieves the taxonomy vocabulary, which includes areas, misses, and other relevant information.
    The response is structured according to the TaxonomyResponse schema.
    
    TaxonomyResponse: {
        "areas": ["area1", "area2", ...],
        "misses": ["miss1", "miss2", ...],
        "goals": ["goal1", "goal2", ...],
        "laws": ["law1", "law2", ...],
        "kinds": ["kind1", "kind2", ...],
        "camera_views": ["face_on", "down_the_line"]
    }
    """
    return TaxonomyResponse.from_vocabulary(taxonomy_service.get_vocabulary(db))
