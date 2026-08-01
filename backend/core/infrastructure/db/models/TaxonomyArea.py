from ..base import Base
from sqlalchemy import Text, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column


class TaxonomyArea(Base):
    """Where on the course an issue lives: full swing, chipping, putting, bunker, pitching.

    Data rather than a CHECK list so the vocabulary can be edited from the admin dashboard
    without a migration. `issues.area` and `taxonomy_misses.area` both reference this.

    Label roles are the same across all three taxonomy tables:
        label         coach vocabulary, admin-facing   "Full swing"
        golfer_label  golfer-facing title              "Full swing"
        blurb         golfer-facing subtitle, optional "Driver through wedge"
    """

    __tablename__ = "taxonomy_areas"

    key: Mapped[str] = mapped_column(Text, primary_key=True)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    golfer_label: Mapped[str] = mapped_column(Text, nullable=False)
    blurb: Mapped[str | None] = mapped_column(Text)

    # Display order in the pickers. Not alphabetical: full swing leads, putting closes.
    sort: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")

    # Soft-retire a value instead of deleting it. Deleting is blocked by RESTRICT once any
    # issue references it, so this is the way to take something out of circulation while
    # leaving existing content intact.
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
