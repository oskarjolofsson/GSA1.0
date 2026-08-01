"""Request and response shapes for the taxonomy editor.

Kept separate from admin_content.py because the audiences differ: that file is about
issues and drills, this one is about the vocabulary they are tagged with. They share a
router prefix and nothing else.
"""

from pydantic import BaseModel, Field


class AdminTaxonomyTermSchema(BaseModel):
    """A vocabulary value as the editor sees it, including retired ones.

    `active` is the important column here. Deleting a term is blocked by ON DELETE RESTRICT
    once any issue carries it, so retiring is the usual way to take something out of
    circulation: it vanishes from the pickers and from validation while existing content
    keeps its tags.
    """

    key: str
    label: str
    golfer_label: str
    blurb: str | None = None
    sort: int = 0
    active: bool = True

    # Only present for misses. A miss belongs to exactly one area, which is what lets the
    # backend refuse a full-swing tag on a putting issue.
    area: str | None = None

    # How many issues currently reference this term. Drives the delete affordance in the
    # editor — a term in use cannot be deleted, only retired.
    usage_count: int = 0


class CreateTaxonomyTermRequest(BaseModel):
    """`key` is normalised server-side (upper-cased, spaces and hyphens to underscores) so
    `slice`, `Slice` and `SLICE` cannot become three rows."""

    key: str = Field(min_length=1)
    label: str = Field(min_length=1)
    golfer_label: str = Field(min_length=1)
    blurb: str | None = None
    sort: int = 0
    active: bool = True

    # Required when creating a miss, ignored otherwise.
    area: str | None = None


class UpdateTaxonomyTermRequest(BaseModel):
    """Partial edit. Omitted fields are left untouched.

    `key` is absent on purpose: it is the foreign key that issue_goals, issue_misses and
    issues reference, so renaming it would orphan every tag. Change what a term *says* by
    editing its labels; replace it entirely by adding the new one and retiring the old.
    """

    label: str | None = None
    golfer_label: str | None = None
    blurb: str | None = None
    sort: int | None = None
    active: bool | None = None
    area: str | None = None
