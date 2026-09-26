from ..base import Base
from sqlalchemy import Text, Integer, ForeignKey, Index, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column


class TaxonomyMissLaw(Base):
    """Links a miss to a law of ball flight that can cause it. Many-to-many: a slice is
    FACE or PATH, and FACE sits behind several misses. A miss with no links means every
    law is a candidate."""

    __tablename__ = "taxonomy_miss_laws"

    # CASCADE: the links are part of the miss's definition, so they go with it.
    miss: Mapped[str] = mapped_column(
        Text,
        ForeignKey("taxonomy_misses.key", ondelete="CASCADE"),
        primary_key=True,
    )

    # RESTRICT: retire a law with active = false instead of deleting it.
    law: Mapped[str] = mapped_column(
        Text,
        ForeignKey("taxonomy_laws.key", ondelete="RESTRICT"),
        primary_key=True,
    )

    # 1 = the law most likely behind this miss. Unique per miss; deferred so a reorder can
    # swap two ranks inside one transaction.
    rank: Mapped[int] = mapped_column(Integer, nullable=False)

    __table_args__ = (
        Index("idx_taxonomy_miss_laws_law", "law"),
        CheckConstraint("rank > 0", name="taxonomy_miss_laws_rank_check"),
        UniqueConstraint(
            "miss", "rank",
            name="uq_taxonomy_miss_laws_miss_rank",
            deferrable=True, initially="DEFERRED",
        ),
    )
