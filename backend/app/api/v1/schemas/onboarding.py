from pydantic import BaseModel

from app.api.v1.schemas.issue import CatalogIssueSchema
from app.api.v1.schemas.taxonomy import TaxonomyMissSchema, TaxonomyTermSchema


class OnboardingCatalogResponse(BaseModel):
    """Everything the pre-signup intro needs, in one unauthenticated call.

    The intro asks a golfer who has no account yet to pick an area, then a goal
    (get better vs. fix an issue), then the miss/goal branch that narrows it, then
    one focus point — the same fork the signed-in library navigates. It needs the
    same vocabulary and the same catalog rows the library renders — which is why
    this is served rather than shipped in the binary. A local copy is what silently
    desynced builds from admin edits before the taxonomy moved server-side.

    One deliberate narrowing versus the authenticated equivalent: global catalog
    issues only, never a user's custom ones. There is no user here to scope by, and
    `list_global_catalog_issues` cannot reach them.
    """

    areas: list[TaxonomyTermSchema]
    goals: list[TaxonomyTermSchema]
    misses: list[TaxonomyMissSchema]
    issues: list[CatalogIssueSchema]
