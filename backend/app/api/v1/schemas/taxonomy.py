from pydantic import BaseModel

from core.services import taxonomy


class TaxonomyResponse(BaseModel):
    """The canonical tag vocabularies, so clients never hardcode them.

    Values only, no display labels: membership is a contract, wording is not.
    """

    areas: list[str]
    misses: list[str]
    goals: list[str]
    kinds: list[str]
    default_area: str
    default_kind: str

    @classmethod
    def from_taxonomy(cls) -> "TaxonomyResponse":
        return cls(
            areas=list(taxonomy.ALLOWED_AREAS),
            misses=list(taxonomy.ALLOWED_MISSES),
            goals=list(taxonomy.ALLOWED_GOALS),
            kinds=list(taxonomy.ALLOWED_KINDS),
            default_area=taxonomy.DEFAULT_AREA,
            default_kind=taxonomy.DEFAULT_KIND,
        )
