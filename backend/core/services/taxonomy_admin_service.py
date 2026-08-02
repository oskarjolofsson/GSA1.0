"""Admin CRUD for the practice vocabulary.

The point of moving areas, goals and misses into tables was to stop every new value being
a migration. Slice C authors roughly forty misses across four new areas of the game, most
of them wrong on the first attempt, so this is the surface that makes that tolerable.

Two rules run through everything here:

DELETING IS RESTRICTED, NOT CASCADED
    issues.area, issue_goals.goal and issue_misses.miss all reference these with ON DELETE
    RESTRICT. Removing a value that content still carries fails at the database, and we
    turn that into a counted message ("12 issues use this") rather than a 500. Silently
    stripping tags off authored content would be worse than refusing.

    `active = false` is the way to retire a value that cannot be deleted: it disappears
    from the pickers and from validation while existing content keeps its tags.

EVERY WRITE BUSTS THE CACHE
    core.services.taxonomy holds the vocabulary in a process-level cache so its validators
    can stay pure. A write that does not reset it is invisible until the process restarts —
    which is exactly the bug this module exists to prevent, so `_committed` wraps it.
"""

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.infrastructure.db import models
from core.services import taxonomy
from core.services.exceptions import (
    ConflictException,
    NotFoundException,
    ValidationException,
)

_MODELS = {
    "area": models.TaxonomyArea,
    "goal": models.TaxonomyGoal,
    "miss": models.TaxonomyMiss,
}

# What references each kind of term, for the "still in use" count on delete.
_USAGE = {
    "area": (models.Issue, models.Issue.area),
    "goal": (models.IssueGoal, models.IssueGoal.goal),
    "miss": (models.IssueMiss, models.IssueMiss.miss),
}


def _model(kind: str):
    try:
        return _MODELS[kind]
    except KeyError:
        raise ValidationException(
            f"Unknown taxonomy kind '{kind}'. Expected one of: {', '.join(_MODELS)}."
        )


def _committed(db_session: Session) -> None:
    """Flush, then drop the cached vocabulary so the next read sees this write."""
    db_session.flush()
    taxonomy.reset_cache()


def _normalize_key(value: str) -> str:
    """Keys are upper-case and underscored. Normalising here rather than trusting the
    caller keeps `slice`, `Slice` and `SLICE` from becoming three rows."""
    key = str(value or "").strip().upper().replace(" ", "_").replace("-", "_")
    if not key:
        raise ValidationException("A taxonomy term needs a key.")
    return key


# ------------------------------ read ------------------------------


def list_terms(kind: str, db_session: Session, *, include_inactive: bool = True) -> list:
    """Every term of one kind, ordered as the pickers render them.

    Defaults to including inactive rows: this is the editor, and a retired value you cannot
    see is a value you cannot reactivate.
    """
    model = _model(kind)
    stmt = select(model).order_by(model.sort, model.key)
    if not include_inactive:
        stmt = stmt.where(model.active.is_(True))
    return list(db_session.scalars(stmt).all())


def get_term(kind: str, key: str, db_session: Session):
    model = _model(kind)
    row = db_session.get(model, _normalize_key(key))
    if row is None:
        raise NotFoundException(f"Taxonomy {kind}", key)
    return row


# ------------------------------ write ------------------------------


def create_term(kind: str, fields: dict, db_session: Session):
    """Add a vocabulary value.

    A miss must name an area that exists — that is the whole basis of area-scoped
    validation, so it is checked here rather than left to the foreign key, where it would
    surface as an IntegrityError with no useful message.
    """
    model = _model(kind)
    key = _normalize_key(fields.get("key"))

    if db_session.get(model, key) is not None:
        raise ConflictException(
            f"A {kind} with key '{key}' already exists. "
            "Edit it instead, or retire it with active = false."
        )

    if kind == "miss":
        area = _normalize_key(fields.get("area"))
        if db_session.get(models.TaxonomyArea, area) is None:
            raise ValidationException(
                f"Unknown area '{area}'. Create the area before adding misses to it."
            )
        fields = {**fields, "area": area}

    row = model(**{**fields, "key": key})
    db_session.add(row)
    _committed(db_session)
    return row


def update_term(kind: str, key: str, fields: dict, db_session: Session):
    """Edit labels, ordering or active state.

    `key` is deliberately not editable. It is the foreign key content references, so
    renaming it would either orphan every tag or need a cascading rewrite — and the golfer
    never sees a key anyway, only `golfer_label`. To change what a term *says*, edit the
    labels; to replace it entirely, add the new one and retire the old.
    """
    row = get_term(kind, key, db_session)

    if kind == "miss" and "area" in fields and fields["area"] is not None:
        area = _normalize_key(fields["area"])
        if db_session.get(models.TaxonomyArea, area) is None:
            raise ValidationException(f"Unknown area '{area}'.")
        fields = {**fields, "area": area}

    for name, value in fields.items():
        if name == "key" or value is None:
            continue
        setattr(row, name, value)

    _committed(db_session)
    return row


def usage_count(kind: str, key: str, db_session: Session) -> int:
    """How many rows reference this term. Drives the delete refusal message."""
    model, column = _USAGE[kind]
    return db_session.scalar(
        select(func.count()).select_from(model).where(column == _normalize_key(key))
    ) or 0


def delete_term(kind: str, key: str, db_session: Session) -> None:
    """Remove a vocabulary value, if nothing uses it.

    Refuses with a count rather than letting ON DELETE RESTRICT surface as a raw
    IntegrityError, and points at `active = false` as the alternative — retiring a value is
    almost always what someone actually wants, since deleting would mean re-tagging
    everything that carries it.
    """
    key = _normalize_key(key)
    row = get_term(kind, key, db_session)

    used = usage_count(kind, key, db_session)
    if used:
        noun = {"area": "issue", "goal": "issue", "miss": "issue"}[kind]
        raise ConflictException(
            f"{used} {noun}{'s' if used != 1 else ''} still use the {kind} '{key}'. "
            "Retire it instead by setting active = false, or retag those issues first."
        )

    # An area can also be referenced by misses rather than issues; that FK is RESTRICT too.
    if kind == "area":
        attached = db_session.scalar(
            select(func.count())
            .select_from(models.TaxonomyMiss)
            .where(models.TaxonomyMiss.area == key)
        ) or 0
        if attached:
            raise ConflictException(
                f"{attached} miss{'es' if attached != 1 else ''} belong to the area "
                f"'{key}'. Move or delete them first."
            )

    db_session.delete(row)
    try:
        _committed(db_session)
    except IntegrityError as exc:
        # Belt and braces: the counts above should have caught every referencing row, so
        # reaching here means a reference we do not know about. Refuse rather than 500.
        db_session.rollback()
        raise ConflictException(
            f"The {kind} '{key}' is still referenced and cannot be deleted."
        ) from exc
