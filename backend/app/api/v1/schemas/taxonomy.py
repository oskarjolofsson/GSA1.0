from pydantic import BaseModel

from core.infrastructure.db import models
from core.services import taxonomy
from sqlalchemy import select
from sqlalchemy.orm import Session


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


class TaxonomyMissSchema(TaxonomyTermSchema):
    """A miss, plus the area it belongs to.

    Misses are area-scoped: a putt is not sliced, a chip is not hooked. Clients group by
    this to offer the right options once an area is chosen, and the backend enforces the
    same rule in `normalize_misses_strict`.
    """

    area: str


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
    def from_db(cls, session: Session) -> "TaxonomyResponse":
        """Read the taxonomy tables directly rather than through the validator cache.

        The cache in core.services.taxonomy holds keys only, because that is all the
        validators need. This endpoint also serves labels, so it reads the rows.
        """
        areas = session.scalars(
            select(models.TaxonomyArea)
            .where(models.TaxonomyArea.active.is_(True))
            .order_by(models.TaxonomyArea.sort, models.TaxonomyArea.key)
        ).all()
        goals = session.scalars(
            select(models.TaxonomyGoal)
            .where(models.TaxonomyGoal.active.is_(True))
            .order_by(models.TaxonomyGoal.sort, models.TaxonomyGoal.key)
        ).all()
        misses = session.scalars(
            select(models.TaxonomyMiss)
            .where(models.TaxonomyMiss.active.is_(True))
            .order_by(models.TaxonomyMiss.sort, models.TaxonomyMiss.key)
        ).all()

        def term(row) -> TaxonomyTermSchema:
            return TaxonomyTermSchema(
                key=row.key,
                label=row.label,
                golfer_label=row.golfer_label,
                blurb=row.blurb,
                sort=row.sort,
            )

        def miss(row) -> TaxonomyMissSchema:
            return TaxonomyMissSchema(
                key=row.key,
                area=row.area,
                label=row.label,
                golfer_label=row.golfer_label,
                blurb=row.blurb,
                sort=row.sort,
            )

        miss_schemas = [miss(m) for m in misses]

        # Every area gets a key, including empty ones: a client rendering an area grid
        # needs to know an area exists with nothing in it yet ("Coming soon") rather than
        # having it silently absent.
        by_area: dict[str, list[TaxonomyMissSchema]] = {a.key: [] for a in areas}
        for m in miss_schemas:
            by_area.setdefault(m.area, []).append(m)

        return cls(
            areas=[term(a) for a in areas],
            goals=[term(g) for g in goals],
            misses=miss_schemas,
            misses_by_area=by_area,
            kinds=list(taxonomy.ALLOWED_KINDS),
            default_area=taxonomy.DEFAULT_AREA,
            default_kind=taxonomy.DEFAULT_KIND,
        )
