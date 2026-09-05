"""Taxonomy administration: the vocabulary issues are tagged with.

Mounted under /admin/content/taxonomy/, all require_admin. Reads for clients live on
/api/v1/taxonomy/ and are only get_current_user-gated — the golfer-facing app renders its
pickers from them. Keeping the two on separate routers makes that difference visible rather
than a per-route detail someone has to notice.

`kind` is a path segment (`areas`, `goals`, `misses`) instead of three near-identical route
sets, because the three tables differ only in whether a row carries an area.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.schemas.admin_taxonomy import (
    AdminTaxonomyTermSchema,
    CreateTaxonomyTermRequest,
    UpdateTaxonomyTermRequest,
)
from app.dependencies.db import get_db
from app.dependencies.require_admin import require_admin
from core.services import taxonomy_admin_service as service
from core.services.dtos.taxonomy_dto import AdminTaxonomyTermDTO

router = APIRouter()

# URL segment -> the singular kind the service speaks. Anything else 422s in the service
# rather than 404ing here, so the message names the valid options.
_KINDS = {"areas": "area", "goals": "goal", "misses": "miss"}


def _to_schema(term: AdminTaxonomyTermDTO) -> AdminTaxonomyTermSchema:
    return AdminTaxonomyTermSchema(
        key=term.key,
        label=term.label,
        golfer_label=term.golfer_label,
        blurb=term.blurb,
        sort=term.sort,
        active=term.active,
        area=term.area,
        usage_count=term.usage_count,
    )


@router.get("/taxonomy/{segment}/", response_model=list[AdminTaxonomyTermSchema])
def list_terms(
    segment: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Every term of one kind, in picker order, including retired ones.

    Inactive rows are included deliberately: this is the editor, and a retired value you
    cannot see is a value you cannot bring back. Each row carries `usage_count` so the UI
    can show that a term is in use — and therefore can be retired but not deleted — without
    a second round trip per row.
    """
    kind = _KINDS.get(segment, segment)
    return [_to_schema(term) for term in service.list_terms(kind, db)]


@router.post("/taxonomy/{segment}/", response_model=AdminTaxonomyTermSchema, status_code=201)
def create_term(
    segment: str,
    request: CreateTaxonomyTermRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Add a vocabulary value.

    This is the endpoint the whole taxonomy refactor exists for: adding a miss used to mean
    a migration plus three hand-synced file edits, which is why four areas of the game went
    unauthored. Creating a miss requires an existing area — that scoping is what lets the
    backend refuse a full-swing tag on a putting issue.

    409 if the key is taken. Keys are normalised, so `slice` collides with `SLICE`.
    """
    kind = _KINDS.get(segment, segment)
    return _to_schema(service.create_term(kind, request.model_dump(exclude_none=True), db))


@router.patch("/taxonomy/{segment}/{key}/", response_model=AdminTaxonomyTermSchema)
def update_term(
    segment: str,
    key: str,
    request: UpdateTaxonomyTermRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Edit labels, ordering or active state. Partial: omitted fields are left untouched.

    `key` cannot be changed — issues, issue_goals and issue_misses all reference it, so a
    rename would orphan every tag. Reword a term by editing its labels; replace it by
    adding the new one and retiring the old.

    Setting `active = false` is how a term is taken out of circulation when content still
    carries it: gone from the pickers and from validation, existing tags untouched.
    """
    kind = _KINDS.get(segment, segment)
    return _to_schema(service.update_term(kind, key, request.model_dump(exclude_unset=True), db))


@router.delete("/taxonomy/{segment}/{key}/", status_code=204)
def delete_term(
    segment: str,
    key: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Remove a vocabulary value, if nothing references it.

    409 with a count when issues still carry it ("12 issues use this"), rather than letting
    ON DELETE RESTRICT surface as a raw IntegrityError. Deleting an area that still has
    misses attached is refused the same way.

    The refusal names `active = false` as the alternative, because retiring is almost always
    what someone actually wants — deleting would mean retagging everything that carries it.
    """
    kind = _KINDS.get(segment, segment)
    service.delete_term(kind, key, db)
