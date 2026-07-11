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

- **Seed content for the new areas.** The `area` taxonomy (`FULL_SWING`, `SHORT_GAME`,
  `PUTTING`, `MENTAL`) ships with only full-swing content; the other three sections
  render "Coming soon". Assign real `area` values to seeded catalog issues so those
  sections light up automatically (grouping is driven by `issues.area`).
