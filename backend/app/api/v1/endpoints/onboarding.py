from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.schemas.issue import CatalogIssueSchema
from app.api.v1.schemas.onboarding import OnboardingCatalogResponse
from app.api.v1.schemas.taxonomy import TaxonomyMissSchema, TaxonomyTermSchema
from app.dependencies.db import get_db
from core.services import issue_authoring_service
from core.services import taxonomy as taxonomy_service

router = APIRouter()


@router.get("/catalog/", response_model=OnboardingCatalogResponse)
def get_onboarding_catalog(db: Session = Depends(get_db)):
    """
    Areas, the miss/goal fork, and startable focus points for the intro shown
    before sign-up.

    The one unauthenticated read in the API. It exists because the intro runs before
    the golfer has a Supabase token, and hardcoding this in the app would put it back
    out of sync with admin edits.

    Safe to serve anonymously because it is strictly the admin-authored catalog:
    `get_global_catalog_issues` filters on `user_id IS NULL`, so no user's custom
    issues can appear here, and nothing about any account is readable through it.
    Every other route stays gated.
    """
    vocabulary = taxonomy_service.get_vocabulary(db)
    issues = issue_authoring_service.list_global_catalog_issues(db)

    return OnboardingCatalogResponse(
        areas=[TaxonomyTermSchema.from_dto(a) for a in vocabulary.areas],
        goals=[TaxonomyTermSchema.from_dto(g) for g in vocabulary.goals],
        misses=[TaxonomyMissSchema.from_dto(m) for m in vocabulary.misses],
        issues=[CatalogIssueSchema.from_domain(i) for i in issues],
    )
