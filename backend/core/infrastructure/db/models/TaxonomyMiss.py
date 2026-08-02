from ..base import Base
from sqlalchemy import Text, Integer, Boolean, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship


class TaxonomyMiss(Base):
    """What the golfer sees go wrong, scoped to one area of the game.

    The `area` column is the load-bearing part. Misses used to be one flat list of eight
    ball-flight values, so nothing stopped a putting issue being tagged SLICE. Scoping them
    is what lets normalize_misses_strict(values, area) refuse a cross-area tag, and what
    makes area-first navigation possible in the library: "which sounds like you?" can only
    offer the right options once the options know where they belong.

        SLICE      -> FULL_SWING     curves hard right
        CHUNK      -> CHIPPING       club hits the ground first
        LEAVES_SHORT -> PUTTING      never gets to the hole

    `blurb` carries most of the weight for short game. Every golfer knows what a slice is;
    almost none could name a chunk, so the subtitle is what makes the row self-identifiable.
    """

    __tablename__ = "taxonomy_misses"

    key: Mapped[str] = mapped_column(Text, primary_key=True)

    # RESTRICT: deleting an area that still has misses attached should fail loudly rather
    # than orphan them.
    area: Mapped[str] = mapped_column(
        Text,
        ForeignKey("taxonomy_areas.key", ondelete="RESTRICT"),
        nullable=False,
    )

    label: Mapped[str] = mapped_column(Text, nullable=False)
    golfer_label: Mapped[str] = mapped_column(Text, nullable=False)
    blurb: Mapped[str | None] = mapped_column(Text)

    sort: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    area_row = relationship("TaxonomyArea", lazy="joined")

    __table_args__ = (
        Index("idx_taxonomy_misses_area", "area"),
    )
