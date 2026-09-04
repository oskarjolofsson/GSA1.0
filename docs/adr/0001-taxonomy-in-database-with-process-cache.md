# Practice taxonomy lives in the database, cached per process

Areas, goals and misses used to be module constants, so every new vocabulary value
meant a migration. Authoring ~40 misses across four new areas made that intolerable,
so they moved into the `taxonomy_*` tables (migration 20260802000000) and became
admin-editable. `kind` stayed a module constant: it is a two-value structural flag
driving program semantics, not vocabulary anyone authors.

## Consequences

**A process-level cache, and the obligations that come with it.** The validators are
pure functions called from a dozen places with no database session to hand —
`normalize_area_strict(dto.area)` deep inside a service, the AI structurer, schema
builders. Threading a session through all of them would be a large diff for no
benefit, so the vocabulary loads once per process into `_CACHE`. This is the
backend's first piece of process-lived mutable state:

1. Admin writes must call `reset_cache()`, or new vocabulary stays invisible until
   restart. `taxonomy_admin_service._committed` wraps every write for this reason.
2. Tests must start cold. The suite rolls back after each test, so a cache warmed by
   rows that were then rolled back would serve values that no longer exist and leak
   across test boundaries. `tests/conftest.py` has an autouse fixture.

**Misses are scoped to one area.** `normalize_misses_strict` refuses a miss belonging
to another area. A putt is not sliced and a chip is not hooked; before the taxonomy
moved into the database all eight misses were one flat ball-flight list, so nothing
stopped a putting issue being tagged SLICE. That check is what makes area-first
navigation honest. The lenient variants (`normalize_miss`, `normalize_goals`) stay
area-agnostic — they exist for machine-generated input, where dropping an
unrecognised value beats raising.

**Deleting a value is restricted, not cascaded.** `issues.area`, `issue_goals.goal`
and `issue_misses.miss` reference these with ON DELETE RESTRICT, so removing a value
that content still carries fails at the database; the admin service turns that into a
counted message ("12 issues use this") rather than a 500. Silently stripping tags off
authored content would be worse than refusing. `active = false` retires a value that
cannot be deleted: it leaves the pickers and validation while existing content keeps
its tags.
