# Drill grades are derived server-side from proportional thresholds

The phone posts a raw score and the metric type; it never posts a grade. `grade_at`
is admin-editable content, so a build shipped before a threshold was retuned would
otherwise keep grading against numbers nobody can see any more. Deriving in
`drill_metrics` means retuning a drill takes effect immediately for every client,
including installs months old.

## Consequences

**Thresholds are proportions, not counts.** `grade_at` holds fractions of the way to a
perfect score, so one authored threshold works at any rep count. On a 10-rep drill the
defaults put 8-10 at dialed, 5-7 at ok, under 5 at rough; change `reps` to 20 and the
same thresholds mean 16 and 10, with no re-authoring.

**Feel and score share a column.** Full swing needs a camera and an AI to say anything
useful, so `blockFeel.ts` asks how the block felt and stuffs that ordinal into
`successful_reps`. Ten 6-footers just needs counting. The derived grade feeds
`program_service._apply_grades` unchanged, so the scheduler — which fills range
sessions with the lowest-strength drills — decides what you practise next from a real
number rather than a vibe.
