from ..base import Base
from sqlalchemy import Text, Integer, Boolean, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship


class TaxonomyMiss(Base):
    """What the golfer sees go wrong, scoped to one area of the game.

    `area` is load-bearing: it is what lets normalize_misses_strict refuse a cross-area tag
    (SLICE is FULL_SWING, CHUNK is CHIPPING) and what makes area-first library navigation
    possible. See ADR-0001.

    `blurb` carries the short game — every golfer knows a slice, almost none could name a
    chunk, so the subtitle is what makes the row self-identifiable.
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
