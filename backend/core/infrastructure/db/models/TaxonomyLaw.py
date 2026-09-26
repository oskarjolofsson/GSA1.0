from ..base import Base
from sqlalchemy import Text, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column


class TaxonomyLaw(Base):
    """
    A law of ball flight: the physical cause behind what the golfer sees.
    More details about theory: https://swingdictionary.golf/laws-of-ball-flight/

    Label roles match the other taxonomy tables:
        label         coach vocabulary, admin-facing   "Face"
        golfer_label  golfer-facing title              "Where the clubface points"
        blurb         golfer-facing subtitle, optional "Open or closed at impact"
    """

    __tablename__ = "taxonomy_laws"

    key: Mapped[str] = mapped_column(Text, primary_key=True)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    golfer_label: Mapped[str] = mapped_column(Text, nullable=False)
    blurb: Mapped[str | None] = mapped_column(Text)

    sort: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
