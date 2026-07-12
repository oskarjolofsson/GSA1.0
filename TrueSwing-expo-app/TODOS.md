# TODOS

## Practice Library (features/library)

- **AI-matching in the library.** Add a "Describe what's going wrong" box atop
  `LibraryScreen` that calls the existing `structureFeedback()`
  (`features/issues/services/issueAuthoringService.ts`) and scrolls to / highlights the
  returned `similar_issues` in the list. Reuses the coach-feedback AI path — no new
  backend. Revisit once plain search proves insufficient or the catalog grows past
  ~30 issues.
  - Deferred during the CEO review of the library reformat (2026-07-10) to avoid
    overlap with the coach-feedback flow until search is shown to be the bottleneck.

- **Author the goal-first content.** The library now navigates GOAL -> MISS -> focus in
  plain language. This only works if the ~15 catalog issues are tagged: set
  `layman_title`, `layman_desc`, `goals[]` (STRAIGHTER/DISTANCE/CONTACT/BIG_MISS/
  SHORT_GAME/PUTTING) and `misses[]` (SLICE/HOOK/PULL/PUSH/TOP/THIN/FAT/LOW_WEAK) per
  issue. Goals with no tagged issues render "Coming soon". Add a couple of `kind='skill'`
  focuses (e.g. a clubhead-speed protocol under DISTANCE) so the non-fault path is real.

- **Seed the other areas of the game.** `area` is now the course-location set
  (`FULL_SWING`, `CHIPPING`, `PUTTING`, `BUNKER`, `PITCHING`); only full-swing content
  exists. Author chipping/putting/bunker/pitching issues and tag them to goals/misses.

- **Skill-focus program semantics.** A `kind='skill'` focus has no fault to retest;
  confirm `program_service` runs it as a fixed-length protocol before wiring the first one.
