"""Reads of the three taxonomy tables.

Every caller wants the same slice — active rows, in display order — so the filter and
the ordering live here once rather than being restated at each call site. `active` is
how a value is taken out of circulation: deleting one is blocked by RESTRICT as soon as
any issue references it.

Two shapes of read, because there are two kinds of caller. The `*_keys` functions feed
the validator cache in `core.services.taxonomy`, which only ever asks "is this key
allowed?". The row functions feed the client-facing vocabulary, which also serves the
display labels.
"""

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..models.Issue import Issue
from ..models.IssueGoal import IssueGoal
from ..models.IssueMiss import IssueMiss
from ..models.TaxonomyArea import TaxonomyArea
from ..models.TaxonomyGoal import TaxonomyGoal
from ..models.TaxonomyMiss import TaxonomyMiss


def _active_in_display_order(model):
    return (
        select(model)
        .where(model.active.is_(True))
        .order_by(model.sort, model.key)
    )


def list_active_areas(session: Session) -> list[TaxonomyArea]:
    """Active areas, in display order. Not alphabetical: full swing leads."""
    return list(session.scalars(_active_in_display_order(TaxonomyArea)).all())


def list_active_goals(session: Session) -> list[TaxonomyGoal]:
    """Active goals, in display order."""
    return list(session.scalars(_active_in_display_order(TaxonomyGoal)).all())


def list_active_misses(session: Session) -> list[TaxonomyMiss]:
    """Active misses, in display order, flat across every area."""
    return list(session.scalars(_active_in_display_order(TaxonomyMiss)).all())


def list_active_area_keys(session: Session) -> list[str]:
    """Just the area keys, for the validator cache."""
    return list(
        session.scalars(
            select(TaxonomyArea.key)
            .where(TaxonomyArea.active.is_(True))
            .order_by(TaxonomyArea.sort, TaxonomyArea.key)
        ).all()
    )


def list_active_goal_keys(session: Session) -> list[str]:
    """Just the goal keys, for the validator cache."""
    return list(
        session.scalars(
            select(TaxonomyGoal.key)
            .where(TaxonomyGoal.active.is_(True))
            .order_by(TaxonomyGoal.sort, TaxonomyGoal.key)
        ).all()
    )


def list_active_miss_keys_with_area(session: Session) -> list[tuple[str, str]]:
    """(key, area) pairs. The area is what makes a miss validatable in isolation."""
    return [
        (row.key, row.area)
        for row in session.execute(
            select(TaxonomyMiss.key, TaxonomyMiss.area)
            .where(TaxonomyMiss.active.is_(True))
            .order_by(TaxonomyMiss.sort, TaxonomyMiss.key)
        ).all()
    ]


# ------------------------------ admin CRUD ------------------------------

# The three tables differ only in whether a row carries an area, so the admin surface
# addresses them by kind rather than repeating three near-identical sets of functions.
_MODELS = {
    "area": TaxonomyArea,
    "goal": TaxonomyGoal,
    "miss": TaxonomyMiss,
}

# What references each kind of term, for the "still in use" count on delete.
_USAGE = {
    "area": (Issue, Issue.area),
    "goal": (IssueGoal, IssueGoal.goal),
    "miss": (IssueMiss, IssueMiss.miss),
}

TERM_KINDS = tuple(_MODELS)


def _model(kind: str):
    """The table for a kind, or None if the kind is not one of TERM_KINDS."""
    return _MODELS.get(kind)


def list_terms(kind: str, session: Session, *, include_inactive: bool = True) -> list:
    """Every term of one kind, ordered as the pickers render them."""
    model = _model(kind)
    stmt = select(model).order_by(model.sort, model.key)
    if not include_inactive:
        stmt = stmt.where(model.active.is_(True))
    return list(session.scalars(stmt).all())


def get_term(kind: str, key: str, session: Session):
    """One term by primary key, or None."""
    return session.get(_model(kind), key)


def area_exists(key: str, session: Session) -> bool:
    """Whether an area row exists. Checked before attaching a miss to it, so the
    caller can say which area is unknown instead of surfacing a foreign-key error."""
    return session.get(TaxonomyArea, key) is not None


def add_term(kind: str, fields: dict, session: Session):
    """Insert a term from already-normalised fields."""
    row = _model(kind)(**fields)
    session.add(row)
    session.flush()
    return row


def set_term_fields(row, fields: dict, session: Session):
    """Overwrite the named columns on an existing term.

    `key` is never among them: it is the value content references, so renaming would
    orphan every tag. The caller strips it.
    """
    for name, value in fields.items():
        setattr(row, name, value)
    session.flush()
    return row


def try_delete_term(row, session: Session) -> bool:
    """Delete a term, or return False if something still references it.

    The counts the caller runs first should catch every referencing row, so a live
    RESTRICT here means a reference we do not know about. Returning False rather than
    letting IntegrityError escape keeps `sqlalchemy.exc` inside this layer.
    """
    session.delete(row)
    try:
        session.flush()
    except IntegrityError:
        session.rollback()
        return False
    return True


def count_term_usage(kind: str, key: str, session: Session) -> int:
    """How many rows reference this term. Drives the delete refusal message."""
    model, column = _USAGE[kind]
    return session.scalar(
        select(func.count()).select_from(model).where(column == key)
    ) or 0


def count_misses_in_area(key: str, session: Session) -> int:
    """Misses attached to an area. That foreign key is RESTRICT too, so an area with
    no issues on it can still be undeletable."""
    return session.scalar(
        select(func.count()).select_from(TaxonomyMiss).where(TaxonomyMiss.area == key)
    ) or 0
