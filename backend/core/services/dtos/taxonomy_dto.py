from dataclasses import dataclass, field


@dataclass(frozen=True)
class TaxonomyTermDTO:
    """One vocabulary value with the words each audience sees.

        label         coach vocabulary, admin-facing     "Slice"
        golfer_label  golfer-facing title                "I slice it"
        blurb         golfer-facing subtitle, optional   "Curves hard right"

    `blurb` is nullable and the clients render it conditionally, so a term whose title
    says everything can stay a single line.
    """

    key: str
    label: str
    golfer_label: str
    blurb: str | None = None
    sort: int = 0


@dataclass(frozen=True)
class TaxonomyMissDTO(TaxonomyTermDTO):
    """A miss, plus the area it belongs to.

    Misses are area-scoped: a putt is not sliced, a chip is not hooked. Clients group by
    this to offer the right options once an area is chosen, and the backend enforces the
    same rule in `normalize_misses_strict`.
    """

    area: str = ""


@dataclass(frozen=True)
class TaxonomyVocabularyDTO:
    """Every vocabulary a client needs to render its tag pickers.

    `misses_by_area` is the shape the library actually navigates — area first, then
    "which sounds like you?" — while `misses` stays flat for callers that only need
    membership. Both views come from the same rows.
    """

    areas: list[TaxonomyTermDTO] = field(default_factory=list)
    goals: list[TaxonomyTermDTO] = field(default_factory=list)
    misses: list[TaxonomyMissDTO] = field(default_factory=list)
    misses_by_area: dict[str, list[TaxonomyMissDTO]] = field(default_factory=dict)
    kinds: list[str] = field(default_factory=list)
    default_area: str = ""
    default_kind: str = ""


@dataclass(frozen=True)
class AdminTaxonomyTermDTO:
    """A vocabulary value as the editor sees it.

    Wider than `TaxonomyTermDTO`, which is shaped for the pickers: this carries the
    retired flag and `usage_count`, the two things that decide whether a term can be
    deleted or only retired.

    `area` is None for areas and goals; only a miss belongs to one.
    """

    key: str
    label: str
    golfer_label: str
    blurb: str | None
    sort: int
    active: bool
    area: str | None = None
    usage_count: int = 0
