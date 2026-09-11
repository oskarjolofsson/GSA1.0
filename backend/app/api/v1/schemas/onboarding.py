from pydantic import BaseModel

from app.api.v1.schemas.issue import CatalogIssueSchema
from app.api.v1.schemas.taxonomy import TaxonomyTermSchema


class OnboardingCatalogResponse(BaseModel):
    """Everything the pre-signup intro needs, in one unauthenticated call.

    The intro asks a golfer who has no account yet to pick an area and one focus
    point in it, so the app can start that focus the moment they sign up. It needs
    the same vocabulary and the same catalog rows the library renders — which is why
    this is served rather than shipped in the binary. A local copy is what silently
    desynced builds from admin edits before the taxonomy moved server-side.

    Two deliberate narrowings versus the authenticated equivalents:

      * `areas` only. The intro stops at "which part of your game?" and then lists
        that area's focus points; it never navigates the miss/goal fork, so sending
        misses, goals and kinds would be shipping an unauthenticated caller more
        vocabulary than it can use.
      * global catalog issues only, never a user's custom ones. There is no user
        here to scope by, and `list_global_catalog_issues` cannot reach them.
    """

    areas: list[TaxonomyTermSchema]
    issues: list[CatalogIssueSchema]
