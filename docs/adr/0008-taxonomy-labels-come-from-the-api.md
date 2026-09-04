# Taxonomy labels come from the API, never from the client

Areas, goals and misses were hardcoded label maps in `trueswing_admin/features/content/constants.ts`
and again in the expo app — four hand-synced copies of one list. Adding a miss meant a
migration plus three file edits, which is a large part of why four areas of the game went
unauthored. The vocabulary moved into `taxonomy_areas` / `taxonomy_goals` / `taxonomy_misses`
(see ADR-0001) and both clients now read labels from `GET /api/v1/taxonomy/`. The admin app
gained an editor for it, so authoring a miss is a form rather than a deploy.

## Consequences

`labelsFrom(taxonomy)` keeps the helper shape the components already called, so only the
source of the words changed. Passing `null` — the taxonomy fetch failed — makes every helper
fall back to the raw key, so a picker degrades to "LOW_WEAK" rather than rendering blank.

Pickers must render from the fetched taxonomy, never a local constant: the write paths
validate strictly and 422 on an unknown value, so a drifted hardcoded list would offer the
admin tags the save then rejects.

`kind` stays a module constant. It is a two-value structural flag (fault / skill) deciding
which branch of the library an issue appears under, not vocabulary anyone authors.

Terms carry both an admin `label` and a golfer-facing `golfer_label` + `blurb` because the
two audiences read different words; the expo app renders them as two lines, the admin
preview joins them into one.
