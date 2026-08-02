from ..base import Base
from sqlalchemy import Text, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column


class TaxonomyGoal(Base):
    """Why a golfer practises: straighter, more distance, better contact, kill the big miss.

    Referenced by issue_goals.goal. Unlike misses, a goal is not scoped to an area — the
    same aspiration reads differently depending on where you are, which is the point.

    Note the collision still present in the seed: SHORT_GAME and PUTTING exist here as goals
    while PUTTING is also an area. Slice C resolves that, together with the expo release
    that stops matching on these keys client-side.
    """

    __tablename__ = "taxonomy_goals"

    key: Mapped[str] = mapped_column(Text, primary_key=True)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    golfer_label: Mapped[str] = mapped_column(Text, nullable=False)
    blurb: Mapped[str | None] = mapped_column(Text)

    sort: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
