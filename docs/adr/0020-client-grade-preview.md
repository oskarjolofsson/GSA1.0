# The client previews a block's grade; the server still owns it

`drillMetric.ts` mirrors the thresholds in `backend/core/services/drill_metrics.py` so the
golfer sees what a number is worth the moment they enter it. Two copies of a grading rule
is a real cost; without it the link between "8 out of 10" and the drill the scheduler picks
next stays invisible until the results screen, which is too late to mean anything.

The copy is safe against staleness because `grade_at` is read off the drill the session
just fetched, never hardcoded into the build — retune a drill in the admin and the next
practice reads the new thresholds. Drill metrics are admin-authored JSONB, so a metric type
can appear without an app release; every accessor is defensive and unknown types fall back
to the feel picker, which always completes.

## Consequences

The preview is display-only. The server grades what gets stored and what moves `strength`;
if the two disagree, the server is right and the client is the bug.

Grade captions name the consequence, not a compliment. An `ok` block used to read "Solid
for this drill", but `GRADE_STRENGTH_DELTA` is `{rough: -1, ok: 0, dialed: +1}`
(`backend/core/services/program_service.py`) — an `ok` block moves the golfer exactly
nowhere. Ten OK sessions with an unmoving `2/7` and no explanation is worse than a blunt
readout.
