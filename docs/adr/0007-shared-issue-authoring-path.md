# User authoring and admin catalog share one write path

`issue_authoring_service.persist_issue_with_drills` writes an issue, its tags, any new
drills and all the links. Both callers use it, differing only in ownership and tag
strictness:

    user  -> user_id=<uid>, source="custom",  strict_tags=False
    admin -> user_id=None,  source="catalog", strict_tags=True

Keeping one implementation is the point: the catalog path and the user path cannot
drift into writing subtly different rows.

## Consequences

Atomicity comes from the request session — every repo call flushes rather than commits,
and `app/dependencies/db.py` commits once at the end or rolls back on any exception, so
a failure part-way through leaves no rows behind.

`strict_tags` picks the validator. Lenient drops unknown values, which suits
AI-generated input; strict raises 422 so an admin never sees a tag silently vanish.

Writing an issue does not start a program; callers use `program_service.generate_program`
for that (ADR-0004).
