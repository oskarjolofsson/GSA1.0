from ..base import Base
import uuid
from sqlalchemy import Text, Integer, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class IssueLaw(Base):
    """Links an issue to the law of ball flight it breaks. Many-to-many: one law
    (e.g. FACE) has several issues; one issue can break several laws."""

    __tablename__ = "issue_laws"

    issue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("issues.id", ondelete="CASCADE"),
        primary_key=True,
    )
    
    # RESTRICT so removing a law that issues still carry fails loudly rather than silently
    # stripping links off authored content.
    law: Mapped[str] = mapped_column(
        Text,
        ForeignKey("taxonomy_laws.key", ondelete="RESTRICT"),
        primary_key=True,
    )

    # 1 = the issue that breaks this law most often. Unique per law; deferred so a reorder
    # can swap two ranks inside one transaction.
    rank: Mapped[int] = mapped_column(Integer, nullable=False)

    issue = relationship("Issue", back_populates="laws")

    __table_args__ = (
        CheckConstraint("rank > 0", name="issue_laws_rank_positive"),
        UniqueConstraint(
            "law", "rank",
            name="uq_issue_laws_law_rank",
            deferrable=True, initially="DEFERRED",
        ),
    )
