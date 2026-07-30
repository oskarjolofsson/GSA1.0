from pydantic import BaseModel

from core.services import taxonomy


class TaxonomyResponse(BaseModel):
    """The canonical tag vocabularies, so clients never hardcode them.

    Before this existed the four vocabularies lived in three places at once (the SQL
    CHECK constraints, core/services/taxonomy.py, and a mirrored constants file in the
    expo app). A client that drifted out of sync would offer a value the backend
    rejects — and on the write paths that used the lenient normalizers, the tag was
    dropped and the request still returned 200. Serving the vocabulary makes that
    class of silent data loss impossible.

    Values only, no labels: membership is a contract, display copy is not.
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
