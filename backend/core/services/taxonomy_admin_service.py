"""Admin CRUD for the practice vocabulary (areas, goals, misses).

Deletes are RESTRICTed, not cascaded: removing a value content still uses returns a
counted 409, and `active = false` is how you retire one instead. Every write must bust
the taxonomy cache; `_committed` does that. See ADR-0001.
"""

from sqlalchemy.orm import Session

from core.infrastructure.db.repositories import taxonomy as taxonomy_repo
from core.services import taxonomy
from core.services.dtos.taxonomy_dto import AdminTaxonomyTermDTO
from core.services.exceptions import (
    ConflictException,
    NotFoundException,
    ValidationException,
)


def _check_kind(kind: str) -> str:
    if kind not in taxonomy_repo.TERM_KINDS:
        raise ValidationException(
            f"Unknown taxonomy kind '{kind}'. "
            f"Expected one of: {', '.join(taxonomy_repo.TERM_KINDS)}."
        )
    return kind


def _committed(db_session: Session) -> None:
    """Drop the cached vocabulary so the next read sees this write.

    The repository has already flushed; this is the cache half of the same step.
    """
    taxonomy.reset_cache()


def _normalize_key(value: str) -> str:
    """Keys are upper-case and underscored. Normalising here rather than trusting the
    caller keeps `slice`, `Slice` and `SLICE` from becoming three rows."""
    key = str(value or "").strip().upper().replace(" ", "_").replace("-", "_")
    if not key:
        raise ValidationException("A taxonomy term needs a key.")
    return key


def _to_dto(kind: str, row, db_session: Session) -> AdminTaxonomyTermDTO:
    return AdminTaxonomyTermDTO(
        key=row.key,
        label=row.label,
        golfer_label=row.golfer_label,
        blurb=row.blurb,
        sort=row.sort,
        active=row.active,
        area=getattr(row, "area", None),
        usage_count=usage_count(kind, row.key, db_session),
    )


def _load_row(kind: str, key: str, db_session: Session):
    """The ORM row behind a term. Private: nothing outside this module sees one."""
    _check_kind(kind)
    row = taxonomy_repo.get_term(kind, _normalize_key(key), db_session)
    if row is None:
        raise NotFoundException(f"Taxonomy {kind}", key)
    return row


# ------------------------------ read ------------------------------


def list_terms(
    kind: str, db_session: Session, *, include_inactive: bool = True
) -> list[AdminTaxonomyTermDTO]:
    """Every term of one kind, ordered as the pickers render them.

    Defaults to including inactive rows: this is the editor, and a retired value you cannot
    see is a value you cannot reactivate.
    """
    _check_kind(kind)
    rows = taxonomy_repo.list_terms(
        kind, db_session, include_inactive=include_inactive
    )
    return [_to_dto(kind, row, db_session) for row in rows]


def get_term(kind: str, key: str, db_session: Session) -> AdminTaxonomyTermDTO:
    return _to_dto(kind, _load_row(kind, key, db_session), db_session)


# ------------------------------ write ------------------------------


def create_term(kind: str, fields: dict, db_session: Session) -> AdminTaxonomyTermDTO:
    """Add a vocabulary value.

    A miss must name an area that exists — that is the whole basis of area-scoped
    validation, so it is checked here rather than left to the foreign key, where it would
    surface as an IntegrityError with no useful message.
    """
    _check_kind(kind)
    key = _normalize_key(fields.get("key"))

    if taxonomy_repo.get_term(kind, key, db_session) is not None:
        raise ConflictException(
            f"A {kind} with key '{key}' already exists. "
            "Edit it instead, or retire it with active = false."
        )

    if kind == "miss":
        area = _normalize_key(fields.get("area"))
        if not taxonomy_repo.area_exists(area, db_session):
            raise ValidationException(
                f"Unknown area '{area}'. Create the area before adding misses to it."
            )
        fields = {**fields, "area": area}

    row = taxonomy_repo.add_term(kind, {**fields, "key": key}, db_session)
    _committed(db_session)
    return _to_dto(kind, row, db_session)


def update_term(
    kind: str, key: str, fields: dict, db_session: Session
) -> AdminTaxonomyTermDTO:
    """Edit labels, ordering or active state.

    `key` is deliberately not editable. It is the foreign key content references, so
    renaming it would either orphan every tag or need a cascading rewrite — and the golfer
    never sees a key anyway, only `golfer_label`. To change what a term *says*, edit the
    labels; to replace it entirely, add the new one and retire the old.
    """
    row = _load_row(kind, key, db_session)

    if kind == "miss" and "area" in fields and fields["area"] is not None:
        area = _normalize_key(fields["area"])
        if not taxonomy_repo.area_exists(area, db_session):
            raise ValidationException(f"Unknown area '{area}'.")
        fields = {**fields, "area": area}

    changes = {
        name: value
        for name, value in fields.items()
        if name != "key" and value is not None
    }
    taxonomy_repo.set_term_fields(row, changes, db_session)

    _committed(db_session)
    return _to_dto(kind, row, db_session)


def usage_count(kind: str, key: str, db_session: Session) -> int:
    """How many rows reference this term. Drives the delete refusal message."""
    return taxonomy_repo.count_term_usage(kind, _normalize_key(key), db_session)


def delete_term(kind: str, key: str, db_session: Session) -> None:
    """Remove a vocabulary value, if nothing uses it.

    Refuses with a count rather than letting ON DELETE RESTRICT surface as a raw
    IntegrityError, and points at `active = false` as the alternative — retiring a value is
    almost always what someone actually wants, since deleting would mean re-tagging
    everything that carries it.
    """
    key = _normalize_key(key)
    row = _load_row(kind, key, db_session)

    used = usage_count(kind, key, db_session)
    if used:
        noun = {"area": "issue", "goal": "issue", "miss": "issue"}[kind]
        raise ConflictException(
            f"{used} {noun}{'s' if used != 1 else ''} still use the {kind} '{key}'. "
            "Retire it instead by setting active = false, or retag those issues first."
        )

    # An area can also be referenced by misses rather than issues; that FK is RESTRICT too.
    if kind == "area":
        attached = taxonomy_repo.count_misses_in_area(key, db_session)
        if attached:
            raise ConflictException(
                f"{attached} miss{'es' if attached != 1 else ''} belong to the area "
                f"'{key}'. Move or delete them first."
            )

    # Belt and braces: the counts above should have caught every referencing row, so a
    # refusal here means a reference we do not know about. Refuse rather than 500.
    if not taxonomy_repo.try_delete_term(row, db_session):
        raise ConflictException(
            f"The {kind} '{key}' is still referenced and cannot be deleted."
        )
    _committed(db_session)
