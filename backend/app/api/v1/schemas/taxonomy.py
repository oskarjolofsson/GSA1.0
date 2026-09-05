from pydantic import BaseModel

from core.services.dtos.taxonomy_dto import (
    TaxonomyMissDTO,
    TaxonomyTermDTO,
    TaxonomyVocabularyDTO,
)


class TaxonomyTermSchema(BaseModel):
    """One vocabulary value with the words each audience sees.

    The clients used to hold these labels themselves — `constants.ts` in the admin and
    `constants/Misses.ts` in the expo app — which meant four hand-synced copies of the same
    list. Serving them here is what lets those files be deleted.

        label         coach vocabulary, admin-facing     "Slice"
        golfer_label  golfer-facing title                "I slice it"
        blurb         golfer-facing subtitle, optional   "Curves hard right"

    `blurb` is nullable and the clients render it conditionally, so a term whose title says
    everything can stay a single line.
    """

    key: str
    label: str
    golfer_label: str
    blurb: str | None = None
    sort: int = 0

    @classmethod
    def from_dto(cls, dto: TaxonomyTermDTO) -> "TaxonomyTermSchema":
        return cls(
            key=dto.key,
            label=dto.label,
            golfer_label=dto.golfer_label,
            blurb=dto.blurb,
            sort=dto.sort,
        )


class TaxonomyMissSchema(TaxonomyTermSchema):
    """A miss, plus the area it belongs to.

    Misses are area-scoped: a putt is not sliced, a chip is not hooked. Clients group by
    this to offer the right options once an area is chosen, and the backend enforces the
    same rule in `normalize_misses_strict`.
    """

    area: str

    @classmethod
    def from_dto(cls, dto: TaxonomyMissDTO) -> "TaxonomyMissSchema":
        return cls(
            key=dto.key,
            area=dto.area,
            label=dto.label,
            golfer_label=dto.golfer_label,
            blurb=dto.blurb,
            sort=dto.sort,
        )


class TaxonomyResponse(BaseModel):
    """The canonical tag vocabularies with their display labels.

    Read-gated by `get_current_user`, not `require_admin`: both the admin dashboard and the
    golfer-facing app render pickers from this. Writes live on the admin router.

    `misses_by_area` is the shape the library actually navigates — area first, then "which
    sounds like you?" — while `misses` stays flat for callers that only need membership.
    Both views come from the same rows.
    """

    areas: list[TaxonomyTermSchema]
    goals: list[TaxonomyTermSchema]
    misses: list[TaxonomyMissSchema]
    misses_by_area: dict[str, list[TaxonomyMissSchema]]

    # `kind` is not table-driven: two structural values that change program behaviour
    # rather than vocabulary anyone authors. Sent as plain strings, as before.
    kinds: list[str]
    default_area: str
    default_kind: str

    @classmethod
    def from_vocabulary(cls, vocabulary: TaxonomyVocabularyDTO) -> "TaxonomyResponse":
        """Wire shape for what the service read.

        Purely a translation: the grouping, the ordering and the empty-area entries are
        all decided in `core.services.taxonomy.get_vocabulary`.
        """
        return cls(
            areas=[TaxonomyTermSchema.from_dto(a) for a in vocabulary.areas],
            goals=[TaxonomyTermSchema.from_dto(g) for g in vocabulary.goals],
            misses=[TaxonomyMissSchema.from_dto(m) for m in vocabulary.misses],
            misses_by_area={
                area: [TaxonomyMissSchema.from_dto(m) for m in misses]
                for area, misses in vocabulary.misses_by_area.items()
            },
            kinds=list(vocabulary.kinds),
            default_area=vocabulary.default_area,
            default_kind=vocabulary.default_kind,
        )
